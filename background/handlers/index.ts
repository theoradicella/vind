import type { BindingsStorage } from '~background/storage/bindings-storage'
import type { PageOverridesStorage } from '~background/storage/page-overrides-storage'
import { getAssertedActiveTabId } from '~background/utils/tab'
import { serializeError } from '~lib/error'
import { log } from '~lib/log'
import { bindingsMessages, pageOverridesMessages, type ErrResponse } from '~messages/storage'

export class StorageHandlers {
  constructor(
    private bindingsStorage: BindingsStorage,
    private pageOverridesStorage: PageOverridesStorage
  ) {
    pageOverridesStorage.getAllPageOverrides()
  }

  init () {
    this.setupBindings()
    this.setupPageOverrides()
  }

  private respondError<T> (promise: Promise<T>, respond: (response: ErrResponse) => void) {
    promise
      .then(() => respond({ error: null }))
      .catch((error) => respond({ error: serializeError(error) }))
  }

  setupBindings () {
    const bindingsStorage = this.bindingsStorage
    bindingsMessages.getAllBindings.stream.subscribe(async ([, sender, respond]) => {
      const bindings = await bindingsStorage.getAllBindings()
      respond(bindings)
    })

    bindingsMessages.getBindingsForSite.stream.subscribe(async ([{ domain, path }, sender, respond]) => {
      const bindings = await bindingsStorage.getBindingsForSite(domain, path)
      respond(bindings)
    })

    bindingsMessages.getBindingsForDomain.stream.subscribe(async ([domain, sender, respond]) => {
      const bindings = await bindingsStorage.getBindingsForDomain(domain)
      respond(bindings)
    })

    bindingsMessages.addBinding.stream.subscribe(async ([binding, sender, respond]) => {
      this.respondError(bindingsStorage.addBinding(binding), respond)
    })

    bindingsMessages.updateBinding.stream.subscribe(async ([binding, sender, respond]) => {
      this.respondError(bindingsStorage.updateBinding(binding), respond)
    })

    bindingsMessages.upsertBinding.stream.subscribe(async ([binding, sender, respond]) => {
      this.respondError(bindingsStorage.upsertBinding(binding), respond)
    })

    bindingsMessages.removeBinding.stream.subscribe(async ([id, sender, respond]) => {
      this.respondError(bindingsStorage.removeBinding(id), respond)
    })

    bindingsStorage.onAdded$.subscribe(async (binding) => {
      log.info('onAdded from background index', binding)
      bindingsMessages.onBindingAdded.ask(binding, {
        tabId: await getAssertedActiveTabId()
      })
    })

    bindingsStorage.onUpdated$.subscribe(async (binding) => {
      log.info('onUpdated from background index', binding)
      bindingsMessages.onBindingUpdated.ask(binding, {
        tabId: await getAssertedActiveTabId()
      })
    })

    bindingsStorage.onDeleted$.subscribe(async (binding) => {
      log.info('onDeleted from background index', binding)
      bindingsMessages.onBindingRemoved.ask(binding, {
        tabId: await getAssertedActiveTabId()
      })
    })
  }

  setupPageOverrides () {
    const pageOverridesStorage = this.pageOverridesStorage
    pageOverridesMessages.getAllPageOverrides.stream.subscribe(async ([, sender, respond]) => {
      const pageOverrides = await pageOverridesStorage.getAllPageOverrides()
      respond(pageOverrides)
    })

    pageOverridesMessages.getPageOverridesForSite.stream.subscribe(async ([{ domain, path }, sender, respond]) => {
      const pageOverrides = await pageOverridesStorage.getPageOverridesForSite(domain, path)
      respond(pageOverrides)
    })

    pageOverridesMessages.addPageOverride.stream.subscribe(async ([pageOverride, sender, respond]) => {
      this.respondError(pageOverridesStorage.addPageOverride(pageOverride), respond)
    })

    pageOverridesMessages.togglePageOverride.stream.subscribe(async ([pageOverride, sender, respond]) => {
      this.respondError(pageOverridesStorage.togglePageOverride(pageOverride), respond)
    })

    pageOverridesMessages.updatePageOverride.stream.subscribe(async ([pageOverride, sender, respond]) => {
      this.respondError(pageOverridesStorage.updatePageOverride(pageOverride), respond)
    })

    pageOverridesMessages.upsertPageOverride.stream.subscribe(async ([pageOverride, sender, respond]) => {
      this.respondError(pageOverridesStorage.upsertPageOverride(pageOverride), respond)
    })

    pageOverridesMessages.removePageOverride.stream.subscribe(async ([id, sender, respond]) => {
      this.respondError(pageOverridesStorage.removePageOverride(id), respond)
    })

    pageOverridesStorage.onAdded$.subscribe(async (pageOverride) => {
      log.info('onAdded from background index', pageOverride)
      pageOverridesMessages.onPageOverrideAdded.ask(pageOverride, {
        tabId: await getAssertedActiveTabId()
      })
    })

    pageOverridesStorage.onUpdated$.subscribe(async (pageOverride) => {
      log.info('onUpdated from background index', pageOverride)
      pageOverridesMessages.onPageOverrideUpdated.ask(pageOverride, {
        tabId: await getAssertedActiveTabId()
      })
    })

    pageOverridesStorage.onDeleted$.subscribe(async (pageOverride) => {
      log.info('onDeleted from background index', pageOverride)
      pageOverridesMessages.onPageOverrideRemoved.ask(pageOverride, {
        tabId: await getAssertedActiveTabId()
      })
    })
  }
}
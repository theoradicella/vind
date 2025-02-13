<script lang="ts">
  import '~/style.sass'
  import '~/lib/fonts-importer'
  import chroma from 'chroma-js'
  import githubMark from 'data-text:~assets/svg/github-mark.svg'
  import { combineLatest, first, map, share } from 'rxjs'
  import logo from '~/assets/icon.png'
  import Button from '~components/button.svelte'
  import Filters from '~components/filters.svelte'
  import BindingsList from '~components/options/bindings-list.svelte'
  import Footer from '~components/options/footer.svelte'
  import Toaster from '~components/toaster.svelte'
  import { handleAnimationState } from '~lib/animation-state'
  import { Binding } from '~lib/binding'
  import { cursorPosition, mouse$ } from '~lib/cursor-position'
  import { log } from '~lib/log'
  import { MapToOrderedTuple } from '~lib/map'
  import { getExtensionVersion, openGithub } from '~lib/misc'
  import { PageController } from '~lib/page-controller'
  import { ResourceMigrator } from '~lib/resource-migrator'
  import type { SymbolName } from '~lib/symbols'
  import { themeController } from '~lib/theme-controller'
  import { Domain, Path } from '~lib/url'
  import { wakeUp } from '~messages/tabs'
  import Migrator from '~options/migrator.svelte'

  type orderedDomainMapOfOrderedPathMap = [
    string,
    [string, { bindings: Binding[]; enabled: boolean }][],
  ]

  const pageController = new PageController('options')
  const resourceMigrator = new ResourceMigrator(
    pageController.bindingsChannel,
    pageController.disabledPathsChannel,
  )
  pageController.refreshResources()

  wakeUp.stream.subscribe(() => {
    log.info('Waking up options page')
    pageController.refreshResources()
  })

  const options: {
    name: string
    key: string
    icon: SymbolName
  }[] = [
    {
      name: 'Bindings',
      key: 'bindings',
      icon: 'link',
    },
    {
      name: 'Import/Export',
      key: 'migrator',
      icon: 'arrowDownRightAndArrowUpLeft',
    },
  ]
  let activeKey = options[0].key

  const onMouse = mouse$.pipe(first())
  const bindingsMap = combineLatest([
    pageController.bindingsByPathMap$,
    pageController.disabledDomainPaths$,
  ]).pipe(
    map(([fromMap, disabledPaths]) => {
      const map = new Map<
        string,
        Map<
          string,
          {
            enabled: boolean
            bindings: Binding[]
          }
        >
      >()

      for (const [_domain, pathMap] of fromMap) {
        const domain = new Domain(_domain)

        const domainMap =
          map.get(domain.value) ??
          new Map<
            string,
            {
              enabled: boolean
              bindings: Binding[]
            }
          >()
        map.set(domain.value, domainMap)

        for (const [_path, bindings] of pathMap) {
          const path = new Path(_path)
          domainMap.set(path.value, {
            enabled: !disabledPaths.has(domain.join(path)),
            bindings,
          })
        }
      }

      return map
    }),
    map((map) => {
      return MapToOrderedTuple(map, (a, b) =>
        a.localeCompare(b),
      ).map<orderedDomainMapOfOrderedPathMap>(([key, map]) => [
        key,
        MapToOrderedTuple(map, (a, b) => a.localeCompare(b)),
      ])
    }),
    share(),
  ) // TODO abstract this out into something more pretty

  const { bg1, bg2 } = (() => {
    const base = chroma.random()
    const darkFactor = -1
    const bg1 = base.brighten(darkFactor)
    const bg2 = base.set('hsl.h', '+25').darken(darkFactor)

    return { bg1, bg2 }
  })()

  async function deleteBinding(id: string) {
    pageController.bindingsChannel.removeBinding(id)
  }
  async function togglePath(domain: Domain, path: Path) {
    pageController.disabledPathsChannel.togglePath(domain, path)
  }
</script>

<div use:themeController use:cursorPosition>
  <div class="options-container p-5 min-h-screen flex flex-col justify-between">
    <div
      use:handleAnimationState
      class="backdrop"
      style:--_bg-1={bg1.hex()}
      style:--_bg-2={bg2.hex()}>
      <div class="v_toggle-visibility w-full h-full" class:enabled={$onMouse}>
        <div
          use:handleAnimationState
          class="mosaic"
          style:background-image={`url(${logo})`}>
        </div>
      </div>
    </div>

    <div class="pt-10 px-5">
      <main class="mx-auto prose prose-2xs w-full made-tommy">
        <div class="sm:flex align-center justify-between mb-4">
          <div class="mb-4">
            <h1 class="font-black mb-1">Vind Options</h1>
            <code class="py-1 px-3"
              >version
              <b>
                {getExtensionVersion()}
              </b>
            </code>
          </div>
          <div class="flex align-center gap-3">
            <Button
              opaque={true}
              round={true}
              roundSize="50px"
              on:click={openGithub}
              roundPadding="15%">
              {@html githubMark}
            </Button>
          </div>
        </div>
        <div role="tablist" class="flex gap-3 flex-wrap items-center">
          {#each options as option}
            <Button
              opaque={true}
              role="tab"
              highlight={activeKey === option.key}
              on:click={() => (activeKey = option.key)}
              icon={option.icon}>
              {option.name}
            </Button>
          {/each}
        </div>
        {#if activeKey === 'bindings'}
          <BindingsList
            {bindingsMap}
            on:remove={(e) => deleteBinding(e.detail.id)}
            on:togglePath={(e) => togglePath(e.detail.domain, e.detail.path)} />
        {/if}
        {#if activeKey === 'migrator'}
          <Migrator migrator={resourceMigrator} />
        {/if}
      </main>
    </div>
    <footer>
      <Footer />
    </footer>
  </div>
  <Filters />
  <Toaster />
</div>

<style lang="sass">
main :global, footer :global
  h1, h2, h3, h4, h5, h6
    font-weight: 700
  h1, h2, h3, h4, h5, h6, p, a, ul, ol, li, blockquote, pre, code, hr
    mix-blend-mode: color-dodge
    color: var(--options-blended-text-color)
  p
    font-size: 1.25em
    font-weight: 500


.backdrop
  position: fixed
  top: 0
  left: 0
  width: 100%
  height: 100%
  z-index: -1

  background: linear-gradient(180deg, var(--_bg-1, #1e3a8a) 0%, var(--_bg-2, #f544f5) 100%)
  animation: hue-rotate 10s infinite
  @keyframes hue-rotate
    0%
      filter: hue-rotate(0deg)
    100%
      filter: hue-rotate(360deg)
  &::after
    content: ''
    position: absolute
    top: 0
    left: 0
    width: 100%
    height: 100%
    background: var(--fallback-b1, oklch(var(--b1) / 1))
    opacity: 0.4
    z-index: 1

._container
  width: min(80em, 100%)

.mosaic
  --mosaic-size-from: 200px
  --mosaic-size-to: 210px
  // --x: calc(var(--mouse-x) * calc(var(--mouse-x)/50))
  --x: var(--mouse-x)
  // --y: calc(var(--mouse-y) * calc(var(--mouse-y)/50))
  --y: var(--mouse-y)
  
  width: 100%
  height: 100%
  opacity: 0.3

  transition: background-position .01s

  background-position: var(--x) var(--y)
  background-repeat: repeat

  animation: 5s infinite size var(--bezier-symmetric)

  animation-fill-mode: backwards

  @keyframes size
    0%
      background-size: var(--mosaic-size-from)
      filter: blur(23px)
    50%
      background-size: var(--mosaic-size-to)
      filter: blur(3px)
    100%
      background-size: var(--mosaic-size-from)
      filter: blur(23px)
</style>

import { get, set } from '~lib/storage'
import { askForBinding, askForBindingStream, askForOptionsPageStream } from '~/messages'
import { getActiveTab, getActiveTabId } from './utils/tab'
import { getCurrentUrlStream, showOverlay } from '~messages/tabs'


async function sanitizeStorage () {
  const bindings = await get('bindings')
  if (typeof bindings === 'undefined') {
    await set('bindings', [])
  }

  console.log('Initial storage', await get('bindings'))
}

(async function init () {
  await sanitizeStorage()
})()


askForBindingStream.subscribe(async ([, sender]) => {
  const tabId = await getActiveTabId()
  if (!tabId) return
  askForBinding.toTab({
    tabId: tabId
  })
})

getCurrentUrlStream.subscribe(async ([, sender, respond]) => {
  const currentTab = await getActiveTab()
  respond(currentTab?.url || null)
})

askForOptionsPageStream.subscribe(async ([, sender]) => {
  chrome.runtime.openOptionsPage()
})

chrome.action.onClicked.addListener(async (tab) => {
  const tabId = await getActiveTabId()
  if (!tabId) return
  showOverlay.toTab({
    tabId: tabId
  })
})
import { initCache, fullRefresh, verifyAndRefresh } from './lib/cache'
import { getCachedCount } from './lib/cache'

const isFirefoxLike =
  import.meta.env.EXTENSION_PUBLIC_BROWSER === 'firefox' ||
  import.meta.env.EXTENSION_PUBLIC_BROWSER === 'gecko-based'

if (isFirefoxLike) {
  browser.browserAction.onClicked.addListener(() => {
    browser.sidebarAction.open()
  })
  browser.runtime.onMessage.addListener((message: unknown) => {
    if (!message || typeof message !== 'object' || !('type' in message) || (message as Record<string, unknown>).type !== 'openSidebar') return
    browser.sidebarAction.open()
  })
}

if (!isFirefoxLike) {
  chrome.action.onClicked.addListener(() => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  })
}

chrome.runtime.onMessage.addListener((message) => {
  if (!message || message.type !== 'openSidebar') return
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  if (!chrome.sidePanel.open) return
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTabId = tabs?.[0]?.id
    if (!activeTabId) return
    try {
      chrome.sidePanel.open({ tabId: activeTabId })
    } catch (error) {
      console.error(error)
    }
  })
})

chrome.runtime.onMessage.addListener((
  message: unknown,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
) => {
  const msg = message as { type: string }
  if (msg.type === 'getDataStatus') {
    sendResponse({ count: getCachedCount() })
    return true
  }
  return undefined
})

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const { fromCache } = await initCache()
    if (fromCache) {
      const { needsRefresh } = await verifyAndRefresh()
      if (needsRefresh) {
        const count = await fullRefresh()
        console.log(`[YC Directory] Cache refreshed: ${count} companies`)
      } else {
        console.log(`[YC Directory] Cache loaded (${getCachedCount()} companies)`)
      }
    } else {
      const count = await fullRefresh()
      console.log(`[YC Directory] Initial load: ${count} companies`)
    }
  } catch (err) {
    console.error('[YC Directory] Initialization error:', err)
  }
})

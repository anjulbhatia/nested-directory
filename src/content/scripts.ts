import { observeCompanyCards, findAllCompanyCards, type YcCompanyData } from './yc-companies'
import '../globals.css'

console.log('[YC Directory] Content script loaded')

async function getTrackedSlugs(): Promise<Set<string>> {
  const { notes, collections } = await chrome.storage.local.get(['notes', 'collections'])
  const slugs = new Set<string>()

  if (notes) {
    for (const note of notes as { startupId: string }[]) {
      if (note.startupId) slugs.add(note.startupId)
    }
  }
  if (collections) {
    for (const col of collections as { startupIds: string[] }[]) {
      for (const id of col.startupIds) {
        if (id) slugs.add(id)
      }
    }
  }

  return slugs
}

function injectIndicators(trackedSlugs: Set<string>) {
  const cards = findAllCompanyCards()

  for (const card of cards) {
    if (!trackedSlugs.has(card.slug)) continue

    const anchor = document.querySelector(`a[href="/companies/${card.slug}"]`)
    if (!anchor) continue

    const existing = anchor.querySelector('.yc-dir-indicator')
    if (existing) continue

    const badge = document.createElement('span')
    badge.className = 'yc-dir-indicator'
    badge.title = 'Tracked in YC Directory'
    badge.style.cssText =
      'position:absolute;top:4px;right:4px;width:10px;height:10px;' +
      'border-radius:50%;background:#ff6600;border:2px solid white;' +
      'box-shadow:0 1px 3px rgba(0,0,0,0.3);z-index:10;'

    const pos = getComputedStyle(anchor).position
    if (pos === 'static') {
      (anchor as HTMLElement).style.position = 'relative'
    }

    anchor.appendChild(badge)
  }
}

let cleanup: (() => void) | null = null

export default function initial() {
  const rootDiv = document.createElement('div')
  rootDiv.setAttribute('data-extension-root', 'true')
  document.body.appendChild(rootDiv)

  const shadowRoot = rootDiv.attachShadow({ mode: 'open' })

  const styleElement = document.createElement('style')
  shadowRoot.appendChild(styleElement)
  fetchCSS().then((response) => { styleElement.textContent = response })

  const container = document.createElement('div')
  container.className = 'content_script'

  const pill = document.createElement('button')
  pill.type = 'button'
  pill.className = 'content_pill'
  pill.setAttribute('aria-label', 'Open sidebar')
  pill.addEventListener('click', () => {
    try {
      const isFirefox =
        import.meta.env.EXTENSION_PUBLIC_BROWSER === 'firefox' ||
        import.meta.env.EXTENSION_PUBLIC_BROWSER === 'gecko-based'
      if (isFirefox) {
        browser.runtime.sendMessage({ type: 'openSidebar' })
      } else {
        chrome.runtime.sendMessage({ type: 'openSidebar' })
      }
    } catch (error) {
      console.error(error)
    }
  })

  pill.textContent = 'Open YC Directory'
  container.appendChild(pill)
  shadowRoot.appendChild(container)

  getTrackedSlugs().then((trackedSlugs) => {
    injectIndicators(trackedSlugs)

    cleanup = observeCompanyCards(() => {
      injectIndicators(trackedSlugs)
    })
  })

  return () => {
    if (cleanup) cleanup()
    rootDiv.remove()
  }
}

async function fetchCSS() {
  const cssUrl = new URL('./styles.css', import.meta.url)
  const response = await fetch(cssUrl)
  const text = await response.text()
  return response.ok ? text : Promise.reject(text)
}

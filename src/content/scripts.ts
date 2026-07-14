import { observeCompanyCards, findAllCompanyCards, type YcCompanyData } from './yc-companies'
import '../globals.css'

const YC_LOGO_SVG = '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="8" fill="#ff6600"/><path d="M14 12h6l4 8 4-8h6L26 26v10h-4V26L14 12Z" fill="#fff"/></svg>'

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

    const existing = anchor.querySelector('.yc-dir-indicator, .yc-dir-indicator-dot')
    if (existing) continue

    const dot = document.createElement('span')
    dot.className = 'yc-dir-indicator-dot'
    dot.title = 'Tracked in YC Directory'
    anchor.appendChild(dot)
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
  container.className = 'yc-dir-root'

  const pill = document.createElement('button')
  pill.type = 'button'
  pill.className = 'yc-dir-pill'
  pill.setAttribute('aria-label', 'Open YC Directory sidebar')
  pill.innerHTML = `${YC_LOGO_SVG} YC Directory`
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

export interface YcCompanyData {
  name: string
  slug: string
  oneLiner: string
  batch: string
  logoUrl: string | null
  ycUrl: string
}

const YC_COMPANIES_SELECTORS = {
  card: 'a[href^="/companies/"]',
  name: '[class*="name"]',
  oneLiner: '[class*="one-liner"]',
  batch: '[class*="batch"]',
  logo: 'img[class*="logo"]',
}

function extractSlug(url: string): string {
  const match = url.match(/\/companies\/([^/?]+)/)
  return match ? match[1] : ''
}

function extractBatch(text: string): string {
  const match = text.match(/((?:Winter|Spring|Summer|Fall)\s+\d{4})/i)
  return match ? match[1] : text.trim()
}

export function parseCompanyCard(element: Element): YcCompanyData | null {
  const anchor = element.closest('a')
  const href = anchor?.getAttribute('href') || ''

  if (!href.includes('/companies/')) return null

  const slug = extractSlug(href)

  const nameEl = element.querySelector(YC_COMPANIES_SELECTORS.name)
  const name = nameEl?.textContent?.trim() || slug

  const oneLinerEl = element.querySelector(YC_COMPANIES_SELECTORS.oneLiner)
  const oneLiner = oneLinerEl?.textContent?.trim() || ''

  const batchEl = element.querySelector(YC_COMPANIES_SELECTORS.batch)
  const batch = batchEl ? extractBatch(batchEl.textContent || '') : ''

  const logoEl = element.querySelector<HTMLImageElement>(YC_COMPANIES_SELECTORS.logo)
  const logoUrl = logoEl?.src || null

  return {
    name,
    slug,
    oneLiner,
    batch,
    logoUrl,
    ycUrl: `https://www.ycombinator.com/companies/${slug}`,
  }
}

export function findAllCompanyCards(): YcCompanyData[] {
  const cards = document.querySelectorAll(YC_COMPANIES_SELECTORS.card)
  const results: YcCompanyData[] = []
  const seen = new Set<string>()

  cards.forEach((card) => {
    const data = parseCompanyCard(card)
    if (data && !seen.has(data.slug)) {
      seen.add(data.slug)
      results.push(data)
    }
  })

  return results
}

export function observeCompanyCards(
  onCardsFound: (cards: YcCompanyData[]) => void,
): () => void {
  const processedSlugs = new Set<string>()

  const processNewCards = () => {
    const cards = findAllCompanyCards()
    const newCards = cards.filter((c) => !processedSlugs.has(c.slug))
    for (const c of newCards) processedSlugs.add(c.slug)
    if (newCards.length > 0) {
      onCardsFound(newCards)
    }
  }

  processNewCards()

  const observer = new MutationObserver(() => {
    processNewCards()
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  return () => observer.disconnect()
}

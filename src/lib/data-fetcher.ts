import type { Startup } from './types'

const API_BASE = 'https://yc-oss.github.io/api'

export async function fetchAllCompanies(): Promise<Startup[]> {
  const res = await fetch(`${API_BASE}/companies/all.json`)
  if (!res.ok) throw new Error(`Failed to fetch companies: ${res.status}`)
  return res.json() as Promise<Startup[]>
}

export async function fetchBatch(batchName: string): Promise<Startup[]> {
  const slug = batchName.toLowerCase().replace(/\s+/g, '-')
  const res = await fetch(`${API_BASE}/batches/${slug}.json`)
  if (!res.ok) throw new Error(`Failed to fetch batch ${batchName}: ${res.status}`)
  return res.json() as Promise<Startup[]>
}

export async function fetchCompany(slugOrName: string): Promise<Startup | null> {
  const all = await fetchAllCompanies()
  const key = slugOrName.toLowerCase().trim()
  const exact = all.find(
    (c) => c.slug?.toLowerCase() === key || c.name?.toLowerCase() === key,
  )
  if (exact) return exact
  return all.find(
    (c) => c.slug?.toLowerCase().includes(key) || c.name?.toLowerCase().includes(key),
  ) ?? null
}

export const BATCHES = [
  'Winter 2027', 'Fall 2026', 'Summer 2026', 'Spring 2026', 'Winter 2026',
  'Fall 2025', 'Summer 2025', 'Spring 2025', 'Winter 2025',
  'Fall 2024', 'Summer 2024', 'Spring 2024', 'Winter 2024',
  'Summer 2023', 'Winter 2023', 'Summer 2022', 'Winter 2022',
  'Summer 2021', 'Winter 2021', 'Summer 2020', 'Winter 2020',
  'Summer 2019', 'Winter 2019', 'Summer 2018', 'Winter 2018',
  'Summer 2017', 'Winter 2017', 'Summer 2016', 'Winter 2016',
  'Summer 2015', 'Winter 2015', 'Summer 2014', 'Winter 2014',
  'Summer 2013', 'Winter 2013', 'Summer 2012', 'Winter 2012',
  'Summer 2011', 'Winter 2011', 'Summer 2010', 'Winter 2010',
  'Summer 2009', 'Winter 2009', 'Summer 2008', 'Winter 2008',
  'Summer 2007', 'Winter 2007', 'Summer 2006', 'Winter 2006',
  'Summer 2005',
]

export function extractIndustries(startups: Startup[]): string[] {
  const set = new Set<string>()
  for (const s of startups) {
    for (const ind of (s.industries || [])) {
      if (ind) set.add(ind)
    }
  }
  return Array.from(set).sort()
}

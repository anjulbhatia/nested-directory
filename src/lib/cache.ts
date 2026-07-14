import type { Startup } from './types'
import { getAllStartups, storeStartups, clearStartups, getStartupCount } from './db'
import { BATCHES } from './data-fetcher'
import Fuse from 'fuse.js'

const BATCH_ORDER = new Map<string, number>(BATCHES.map((b, i) => [b, i]))

const MEM_CACHE = new Map<string, Startup>()
let MEM_ARRAY: Startup[] = []
let MEM_LOADED = false
let CACHED_CONTENT_LENGTH: number | null = null
let CACHED_COUNT = 0

const API_ALL_URL = 'https://yc-oss.github.io/api/companies/all.json'
const CL_KEY = 'yc-cache-content-length'
const CNT_KEY = 'yc-cache-count'

async function loadFromIndexedDB(): Promise<void> {
  if (MEM_LOADED) return
  const all = await getAllStartups()
  for (const s of all) {
    MEM_CACHE.set(s.slug, s)
  }
  MEM_ARRAY = sortByBatchOrder(all)
  MEM_LOADED = true
  CACHED_COUNT = all.length
}

function sortByBatchOrder(startups: Startup[]): Startup[] {
  return [...startups].sort((a, b) => {
    const oa = BATCH_ORDER.get(a.batch) ?? 9999
    const ob = BATCH_ORDER.get(b.batch) ?? 9999
    return oa - ob
  })
}

export async function initCache(): Promise<{ fromCache: boolean; count: number }> {
  const cl = await chrome.storage.local.get([CL_KEY, CNT_KEY])
  CACHED_CONTENT_LENGTH = (cl[CL_KEY] as number) ?? null
  CACHED_COUNT = (cl[CNT_KEY] as number) ?? 0

  const dbCount = await getStartupCount()

  if (dbCount > 0) {
    await loadFromIndexedDB()
    return { fromCache: true, count: MEM_CACHE.size }
  }

  return { fromCache: false, count: 0 }
}

export async function verifyAndRefresh(): Promise<{ needsRefresh: boolean; remoteCount?: number }> {
  try {
    const headResp = await fetch(API_ALL_URL, { method: 'HEAD' })
    const remoteLength = Number(headResp.headers.get('content-length') ?? '0')

    if (CACHED_CONTENT_LENGTH === remoteLength && MEM_LOADED) {
      return { needsRefresh: false }
    }

    CACHED_CONTENT_LENGTH = remoteLength
    await chrome.storage.local.set({ [CL_KEY]: remoteLength })
    return { needsRefresh: true }
  } catch {
    return { needsRefresh: false }
  }
}

export async function fullRefresh(): Promise<number> {
  const res = await fetch(API_ALL_URL)
  const companies: Startup[] = await res.json()

  MEM_CACHE.clear()
  for (const s of companies) {
    MEM_CACHE.set(s.slug, s)
  }
  MEM_ARRAY = sortByBatchOrder(companies)
  MEM_LOADED = true
  CACHED_COUNT = companies.length

  await clearStartups()
  await storeStartups(companies)
  await chrome.storage.local.set({
    [CL_KEY]: CACHED_CONTENT_LENGTH,
    [CNT_KEY]: CACHED_COUNT,
  })

  return companies.length
}

export function getPaginated(offset: number, limit: number): Startup[] {
  return MEM_ARRAY.slice(offset, offset + limit)
}

export function getAllFromCache(): Startup[] {
  return MEM_ARRAY
}

export function getCachedCount(): number {
  return MEM_CACHE.size
}

let fuseInstance: Fuse<Startup> | null = null

function getFuse(): Fuse<Startup> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(MEM_ARRAY, {
      keys: [
        { name: 'name', weight: 3 },
        { name: 'one_liner', weight: 1.5 },
        { name: 'tags', weight: 1 },
        { name: 'industries', weight: 0.8 },
        { name: 'slug', weight: 0.5 },
        { name: 'location', weight: 0.3 },
      ],
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
    })
  }
  return fuseInstance
}

export function searchInCache(
  query: string,
  filters?: { batches?: string[]; industries?: string[] },
): Startup[] {
  if (!MEM_ARRAY.length) return []

  const q = query.trim()
  if (!q) {
    let pool = MEM_ARRAY
    if (filters?.batches && filters.batches.length > 0) {
      const batchSet = new Set(filters.batches)
      pool = pool.filter((s) => batchSet.has(s.batch))
    }
    if (filters?.industries && filters.industries.length > 0) {
      const indSet = new Set(filters.industries)
      pool = pool.filter((s) => (s.industries || []).some((i) => indSet.has(i)))
    }
    return pool
  }

  const fuse = getFuse()
  const results = fuse.search(q, { limit: 200 })
  let items = results.map((r) => r.item)

  if (filters?.batches && filters.batches.length > 0) {
    const batchSet = new Set(filters.batches)
    items = items.filter((s) => batchSet.has(s.batch))
  }
  if (filters?.industries && filters.industries.length > 0) {
    const indSet = new Set(filters.industries)
    items = items.filter((s) => (s.industries || []).some((i) => indSet.has(i)))
  }

  return items
}

export function getFiltered(
  batches?: string[],
  industries?: string[],
): Startup[] {
  let pool = MEM_ARRAY

  if (batches && batches.length > 0) {
    const batchSet = new Set(batches)
    pool = pool.filter((s) => batchSet.has(s.batch))
  }
  if (industries && industries.length > 0) {
    const indSet = new Set(industries)
    pool = pool.filter((s) => (s.industries || []).some((i) => indSet.has(i)))
  }

  return pool
}

export async function clearCache(): Promise<void> {
  MEM_CACHE.clear()
  MEM_ARRAY = []
  MEM_LOADED = false
  CACHED_CONTENT_LENGTH = null
  CACHED_COUNT = 0
  await clearStartups()
  await chrome.storage.local.remove([CL_KEY, CNT_KEY])
}

export function getAllIndustries(): string[] {
  const set = new Set<string>()
  for (const s of MEM_CACHE.values()) {
    for (const ind of s.industries || []) {
      if (ind) set.add(ind)
    }
  }
  return Array.from(set).sort()
}

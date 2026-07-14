import type { Collection, Note, StartupUserTag } from './types'

const KEYS = {
  COLLECTIONS: 'collections',
  NOTES: 'notes',
  TAGS: 'tags',
  DATA_VERSION: 'dataVersion',
  LAST_UPDATED: 'lastUpdated',
} as const

function defaultCollections(): Collection[] {
  return [
    { id: 'likes', name: 'Likes', startupIds: [] },
    { id: 'bookmarked', name: 'Bookmarked', startupIds: [] },
  ]
}

export async function getCollections(): Promise<Collection[]> {
  const { collections } = await chrome.storage.local.get(KEYS.COLLECTIONS)
  if (!collections || !Array.isArray(collections) || collections.length === 0) {
    const defaults = defaultCollections()
    await chrome.storage.local.set({ [KEYS.COLLECTIONS]: defaults })
    return defaults
  }
  const hasLikes = collections.some((c: Collection) => c.id === 'likes')
  const hasBookmarked = collections.some((c: Collection) => c.id === 'bookmarked')
  if (!hasLikes || !hasBookmarked) {
    const defaults = defaultCollections()
    const merged = [...collections]
    if (!hasLikes) merged.unshift(defaults[0])
    if (!hasBookmarked) merged.unshift(defaults[1])
    await chrome.storage.local.set({ [KEYS.COLLECTIONS]: merged })
    return merged
  }
  return collections as Collection[]
}

export async function saveCollections(collections: Collection[]): Promise<void> {
  await chrome.storage.local.set({ [KEYS.COLLECTIONS]: collections })
}

export async function toggleStartupInCollection(
  startupId: string,
  collectionId: string,
): Promise<Collection[]> {
  const collections = await getCollections()
  const updated = collections.map((c) => {
    if (c.id !== collectionId) return c
    const has = c.startupIds.includes(startupId)
    return { ...c, startupIds: has ? c.startupIds.filter((id) => id !== startupId) : [...c.startupIds, startupId] }
  })
  await saveCollections(updated)
  return updated
}

export async function isStartupInCollection(
  startupId: string,
  collectionId: string,
): Promise<boolean> {
  const collections = await getCollections()
  const col = collections.find((c) => c.id === collectionId)
  return col ? col.startupIds.includes(startupId) : false
}

export async function getNotes(): Promise<Note[]> {
  const { notes } = await chrome.storage.local.get(KEYS.NOTES)
  return (notes as Note[]) || []
}

export async function saveNotes(notes: Note[]): Promise<void> {
  await chrome.storage.local.set({ [KEYS.NOTES]: notes })
}

export async function getTags(): Promise<StartupUserTag[]> {
  const { tags } = await chrome.storage.local.get(KEYS.TAGS)
  return (tags as StartupUserTag[]) || []
}

export async function saveTags(tags: StartupUserTag[]): Promise<void> {
  await chrome.storage.local.set({ [KEYS.TAGS]: tags })
}

export async function getDataVersion(): Promise<number | null> {
  const { dataVersion } = await chrome.storage.local.get(KEYS.DATA_VERSION)
  return (dataVersion as number) ?? null
}

export async function setDataVersion(): Promise<void> {
  await chrome.storage.local.set({
    [KEYS.DATA_VERSION]: Date.now(),
    [KEYS.LAST_UPDATED]: new Date().toISOString(),
  })
}

export async function getLastUpdated(): Promise<string | null> {
  const { lastUpdated } = await chrome.storage.local.get(KEYS.LAST_UPDATED)
  return (lastUpdated as string) ?? null
}

export async function clearAllUserData(): Promise<void> {
  await chrome.storage.local.remove([KEYS.COLLECTIONS, KEYS.NOTES, KEYS.TAGS])
}

export async function importUserData(data: {
  collections?: Collection[]
  notes?: Note[]
  tags?: StartupUserTag[]
}): Promise<void> {
  const toSet: Record<string, unknown> = {}
  if (data.collections) toSet[KEYS.COLLECTIONS] = data.collections
  if (data.notes) toSet[KEYS.NOTES] = data.notes
  if (data.tags) toSet[KEYS.TAGS] = data.tags
  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet)
  }
}

export async function exportUserData(): Promise<{
  collections: Collection[]
  notes: Note[]
  tags: StartupUserTag[]
}> {
  const [collections, notes, tags] = await Promise.all([
    getCollections(),
    getNotes(),
    getTags(),
  ])
  return { collections, notes, tags }
}

import { openDB, type IDBPDatabase } from 'idb'
import type { Startup } from './types'

const DB_NAME = 'yc-directory'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<unknown>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('startups')) {
          const store = db.createObjectStore('startups', { keyPath: 'slug' })
          store.createIndex('batch', 'batch')
          store.createIndex('name', 'name')
        }
      },
    })
  }
  return dbPromise
}

export async function getAllStartups(): Promise<Startup[]> {
  const db = await getDb()
  return (await db.getAll('startups')) as Startup[]
}

export async function getStartupBySlug(slug: string): Promise<Startup | undefined> {
  const db = await getDb()
  return (await db.get('startups', slug)) as Startup | undefined
}

export async function getStartupsByBatch(batch: string): Promise<Startup[]> {
  const db = await getDb()
  const index = (db as IDBPDatabase<{ startups: Startup }>).transaction('startups').store.index('batch')
  return (await index.getAll(batch)) as Startup[]
}

export async function storeStartups(startups: Startup[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('startups', 'readwrite')
  for (const s of startups) {
    await tx.store.put(s)
  }
  await tx.done
}

export async function clearStartups(): Promise<void> {
  const db = await getDb()
  await db.clear('startups')
}

export async function getStartupCount(): Promise<number> {
  const db = await getDb()
  return db.count('startups')
}

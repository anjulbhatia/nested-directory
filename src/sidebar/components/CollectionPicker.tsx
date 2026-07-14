import { useState, useEffect } from 'react'
import type { Collection, Startup } from '../../lib/types'
import { getCollections, saveCollections } from '../../lib/storage'
import { Check, Plus } from 'lucide-react'

interface CollectionPickerProps {
  startup: Startup
}

const LIST_COLORS = ['#ff6600', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#ec4899', '#14b8a6', '#eab308']

export function CollectionPicker({ startup }: CollectionPickerProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const startupId = startup.slug || startup.id

  useEffect(() => {
    getCollections().then(setCollections)
  }, [])

  const isInCollection = (c: Collection) => c.startupIds.includes(startupId)

  const toggleStartup = async (collection: Collection) => {
    const updated = collections.map((c) => {
      if (c.id !== collection.id) return c
      const ids = isInCollection(c)
        ? c.startupIds.filter((id) => id !== startupId)
        : [...c.startupIds, startupId]
      return { ...c, startupIds: ids }
    })
    setCollections(updated)
    await saveCollections(updated)
  }

  if (collections.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {collections.map((c) => (
        <button
          key={c.id}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] border transition-all ${
            isInCollection(c)
              ? 'bg-primary/10 border-primary/30 text-primary font-medium'
              : 'border-border/50 text-muted-foreground hover:border-foreground/30 hover:text-foreground'
          }`}
          onClick={() => toggleStartup(c)}
          title={c.name}
        >
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: c.color || LIST_COLORS[collections.indexOf(c) % LIST_COLORS.length] }}
          />
          <span className="truncate max-w-[80px]">{c.name}</span>
          {isInCollection(c) && <Check className="h-2.5 w-2.5 shrink-0" />}
        </button>
      ))}
    </div>
  )
}

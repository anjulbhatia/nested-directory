import { useState, useEffect } from 'react'
import type { Collection, Startup } from '../../lib/types'
import { getCollections, saveCollections } from '../../lib/storage'
import { Check } from 'lucide-react'

interface CollectionPickerProps {
  startup: Startup
}

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
    <div className="flex flex-wrap gap-1">
      {collections.map((c) => (
        <button
          key={c.id}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
            isInCollection(c)
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
          }`}
          onClick={() => toggleStartup(c)}
          title={c.name}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
          <span className="truncate max-w-[60px]">{c.name}</span>
          {isInCollection(c) && <Check className="h-2.5 w-2.5 shrink-0" />}
        </button>
      ))}
    </div>
  )
}

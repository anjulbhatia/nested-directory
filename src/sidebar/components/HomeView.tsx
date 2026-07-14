import { useState, useEffect } from 'react'
import type { Collection, Note, Startup } from '../../lib/types'
import { getCollections, saveCollections } from '../../lib/storage'
import { getNotes, saveNotes } from '../../lib/storage'
import { getAllStartups, getStartupBySlug } from '../../lib/db'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { StartupCard } from './StartupCard'
import { StartupDetail } from './StartupDetail'
import { Search, Plus, StickyNote, Trash2, Home, Heart, Bookmark, X } from 'lucide-react'

export function HomeView() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [allStartups, setAllStartups] = useState<Startup[]>([])
  const [activeTab, setActiveTab] = useState<string>('likes')
  const [showNewList, setShowNewList] = useState(false)
  const [newName, setNewName] = useState('')
  const [detailStartup, setDetailStartup] = useState<Startup | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    getCollections().then(setCollections)
    getAllStartups().then(setAllStartups)
  }, [])

  const handleCreateList = async () => {
    if (!newName.trim()) return
    const col: Collection = {
      id: `col-${Date.now()}`,
      name: newName.trim(),
      startupIds: [],
    }
    const updated = [...collections, col]
    setCollections(updated)
    await saveCollections(updated)
    setNewName('')
    setShowNewList(false)
    setActiveTab(col.id)
  }

  const handleDeleteList = async (id: string) => {
    if (id === 'likes' || id === 'bookmarked') return
    const updated = collections.filter((c) => c.id !== id)
    setCollections(updated)
    await saveCollections(updated)
    if (activeTab === id) setActiveTab('likes')
  }

  const tabs = collections.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.id === 'likes' ? Heart : c.id === 'bookmarked' ? Bookmark : null,
    startupIds: c.startupIds,
  }))

  const activeCollection = collections.find((c) => c.id === activeTab)
  const activeStartupIds = activeCollection?.startupIds || []

  const startupsInTab = activeTab === 'notes'
    ? null
    : activeTab === 'likes' || activeTab === 'bookmarked' || activeCollection
      ? activeStartupIds
          .map((id) => allStartups.find((s) => (s.slug || s.id) === id))
          .filter((s): s is Startup => !!s)
      : []

  const notesList = activeTab === 'notes'
    ? allStartups.filter((s) => {
        // We'll check notes in the render
        return false
      })
    : []

  // If "notes" tab, get all startups that have notes
  const [notesData, setNotesData] = useState<{ startupName: string; startupSlug: string; note: Note }[]>([])

  useEffect(() => {
    if (activeTab === 'notes') {
      getNotes().then(async (notes) => {
        const enriched = await Promise.all(
          notes.map(async (note) => {
            const startup = allStartups.find((s) => (s.slug || s.id) === note.startupId)
            return {
              startupName: startup?.name || note.startupId,
              startupSlug: note.startupId,
              note,
            }
          }),
        )
        enriched.sort((a, b) => b.note.updatedAt - a.note.updatedAt)
        setNotesData(enriched)
      })
    }
  }, [activeTab, allStartups])

  const handleDeleteNote = async (noteId: string) => {
    const allNotes = await getNotes()
    const updated = allNotes.filter((n) => n.id !== noteId)
    await saveNotes(updated)
    setNotesData((prev) => prev.filter((d) => d.note.id !== noteId))
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isNotes = tab.id === 'notes'
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {isNotes ? (
                <StickyNote className="h-3.5 w-3.5" />
              ) : Icon ? (
                <Icon className="h-3.5 w-3.5" />
              ) : null}
              {tab.name}
              {!isNotes && (
                <span className="text-[10px] ml-0.5 opacity-60">{tab.startupIds.length}</span>
              )}
              {tab.id !== 'likes' && tab.id !== 'bookmarked' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteList(tab.id) }}
                  className="ml-0.5 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === 'notes' ? (
        <div className="space-y-2">
          {notesData.length === 0 && (
            <div className="text-center py-12 text-xs text-muted-foreground">
              <StickyNote className="h-6 w-6 mx-auto mb-2 opacity-50" />
              No notes yet
            </div>
          )}
          {notesData.map(({ startupName, startupSlug, note }) => (
            <Card key={note.id}>
              <CardContent className="p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-medium">{startupName}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : startupsInTab && startupsInTab.length > 0 ? (
        <div className="space-y-2">
          {startupsInTab.map((s) => (
            <StartupCard
              key={s.slug}
              startup={s}
              onViewDetail={(startup) => {
                setDetailStartup(startup)
                setDetailOpen(true)
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-xs text-muted-foreground">
          {activeTab === 'likes'
            ? 'Heart startups from the Browse tab to see them here'
            : activeTab === 'bookmarked'
              ? 'Bookmark startups from the Browse tab to see them here'
              : 'This list is empty'}
        </div>
      )}

      {showNewList && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-20">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNewList(false)} />
          <div className="relative bg-background border rounded-lg shadow-xl p-4 w-72 mx-auto">
            <h3 className="text-sm font-semibold mb-3">New List</h3>
            <Input
              placeholder="List name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-9 text-sm mb-3"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowNewList(false)}>
                Cancel
              </Button>
              <Button size="sm" className="text-xs" onClick={handleCreateList} disabled={!newName.trim()}>
                <Plus className="h-3 w-3 mr-1" /> Create
              </Button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowNewList(true)}
        className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center z-40"
      >
        <Plus className="h-5 w-5" />
      </button>

      <StartupDetail
        startup={detailStartup}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}

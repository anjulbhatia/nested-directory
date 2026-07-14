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
import { Search, Plus, StickyNote, Trash2, Heart, Bookmark, X, ExternalLink } from 'lucide-react'

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
    <div className="flex flex-col h-full">
      <div className="p-3 pb-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isNotes = tab.id === 'notes'
            return (
              <div
                key={tab.id}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                onClick={() => setActiveTab(tab.id)}
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
                {tab.id !== 'likes' && tab.id !== 'bookmarked' && tab.id !== 'notes' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteList(tab.id) }}
                    className="ml-0.5 text-muted-foreground hover:text-destructive rounded-full hover:bg-destructive/10 w-3.5 h-3.5 flex items-center justify-center transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            )
          })}
          <div
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
            onClick={() => setActiveTab('notes')}
          >
            <StickyNote className="h-3.5 w-3.5" />
            Notes
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {activeTab === 'notes' ? (
          notesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <StickyNote className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">No notes yet</p>
              <p className="text-xs text-muted-foreground/60 max-w-[200px]">
                Add notes to startups from the card or detail view
              </p>
            </div>
          ) : (
            notesData.map(({ startupName, startupSlug, note }) => (
              <Card key={note.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <StickyNote className="h-3 w-3 text-yc-orange shrink-0" />
                      <a
                        href={`https://www.ycombinator.com/companies/${startupSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium hover:text-yc-orange transition-colors truncate"
                      >
                        {startupName}
                      </a>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3 leading-relaxed">{note.content}</p>
                </CardContent>
              </Card>
            ))
          )
        ) : startupsInTab && startupsInTab.length > 0 ? (
          startupsInTab.map((s) => (
            <StartupCard
              key={s.slug}
              startup={s}
              onViewDetail={(startup) => {
                setDetailStartup(startup)
                setDetailOpen(true)
              }}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3 ${
              activeTab === 'likes' ? '' : activeTab === 'bookmarked' ? '' : ''
            }`}>
              {activeTab === 'likes' ? (
                <Heart className="h-5 w-5 text-muted-foreground" />
              ) : activeTab === 'bookmarked' ? (
                <Bookmark className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Search className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {activeTab === 'likes'
                ? 'No liked startups'
                : activeTab === 'bookmarked'
                  ? 'No bookmarked startups'
                  : 'This list is empty'}
            </p>
            <p className="text-xs text-muted-foreground/60 max-w-[220px]">
              {activeTab === 'likes'
                ? 'Heart startups from the Browse tab to see them here'
                : activeTab === 'bookmarked'
                  ? 'Bookmark startups from the Browse tab to see them here'
                  : 'Add startups to this list from the detail view'}
            </p>
          </div>
        )}
      </div>

      {showNewList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewList(false)} />
          <div className="relative bg-background border rounded-xl shadow-2xl p-5 w-80 mx-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">New List</h3>
              <button onClick={() => setShowNewList(false)} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Input
              placeholder="List name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-9 text-sm mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setShowNewList(false)}>
                Cancel
              </Button>
              <Button size="sm" className="text-xs h-8 gap-1.5" onClick={handleCreateList} disabled={!newName.trim()}>
                <Plus className="h-3 w-3" /> Create
              </Button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowNewList(true)}
        className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-yc-orange text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center z-40"
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

import { useState, useEffect, useRef } from 'react'
import type { Startup, Note } from '../../lib/types'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { getNotes, saveNotes } from '../../lib/storage'
import { toggleStartupInCollection, isStartupInCollection } from '../../lib/storage'
import { Heart, MessageCircle, MoreHorizontal, Bookmark, ExternalLink, Save, MapPin, Users, Calendar } from 'lucide-react'

interface StartupCardProps {
  startup: Startup
  onViewDetail: (startup: Startup) => void
}

export function StartupCard({ startup, onViewDetail }: StartupCardProps) {
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [note, setNote] = useState<Note | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const startupId = startup.slug || startup.id
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    isStartupInCollection(startupId, 'likes').then(setLiked)
    isStartupInCollection(startupId, 'bookmarked').then(setBookmarked)
    getNotes().then((notes) => {
      const existing = notes.find((n) => n.startupId === startupId)
      if (existing) {
        setNote(existing)
        setNoteContent(existing.content)
      }
    })
  }, [startupId])

  const handleLike = async () => {
    const updated = await toggleStartupInCollection(startupId, 'likes')
    const col = updated.find((c) => c.id === 'likes')
    setLiked(col ? col.startupIds.includes(startupId) : false)
  }

  const handleBookmark = async () => {
    const updated = await toggleStartupInCollection(startupId, 'bookmarked')
    const col = updated.find((c) => c.id === 'bookmarked')
    setBookmarked(col ? col.startupIds.includes(startupId) : false)
  }

  const handleToggleNote = () => {
    setShowNoteEditor(!showNoteEditor)
  }

  const handleSaveNote = async () => {
    setSavingNote(true)
    const allNotes = await getNotes()
    const now = Date.now()

    if (note) {
      const updated = { ...note, content: noteContent, updatedAt: now }
      const idx = allNotes.findIndex((n) => n.id === note.id)
      if (idx >= 0) allNotes[idx] = updated
      setNote(updated)
    } else {
      const newNote: Note = {
        id: `note-${startupId}-${now}`,
        startupId,
        content: noteContent,
        createdAt: now,
        updatedAt: now,
      }
      allNotes.push(newNote)
      setNote(newNote)
    }

    await saveNotes(allNotes)
    setSavingNote(false)
  }

  const statusVariant = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active': return 'green' as const
      case 'acquired': return 'yellow' as const
      case 'public': return 'blue' as const
      default: return 'gray' as const
    }
  }

  const ycUrl = startup.url || `https://www.ycombinator.com/companies/${startup.slug}`

  return (
    <div className="rounded-xl border bg-card hover:shadow-md hover:border-foreground/20 transition-all duration-200">
      <div className="p-3 pb-1.5">
        <div className="flex items-start gap-3">
          {startup.small_logo_thumb_url ? (
            <img
              src={startup.small_logo_thumb_url}
              alt=""
              className="w-10 h-10 rounded-xl object-contain bg-muted shrink-0 mt-0.5"
              onError={(e) => {
                (e.target as HTMLImageElement).outerHTML =
                  `<div class="w-10 h-10 rounded-xl bg-yc-orange/10 flex items-center justify-center text-yc-orange font-bold text-base shrink-0 mt-0.5">${startup.name[0]}</div>`
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-yc-orange/10 flex items-center justify-center text-yc-orange font-bold text-base shrink-0 mt-0.5">
              {startup.name[0]}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <a
                  href={ycUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold leading-tight hover:text-yc-orange transition-colors truncate block"
                >
                  {startup.name}
                </a>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                  {startup.one_liner}
                </p>
              </div>
              {startup.website && (
                <a
                  href={startup.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground/60 hover:text-foreground shrink-0 mt-0.5"
                  title="Visit website"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="orange" className="text-[10px] px-1.5 py-px leading-tight font-medium">{startup.batch}</Badge>
              {startup.status && (
                <Badge variant={statusVariant(startup.status)} className="text-[10px] px-1.5 py-px leading-tight">
                  {startup.status}
                </Badge>
              )}
              {startup.industries?.slice(0, 2).map((ind) => (
                <Badge key={ind} variant="secondary" className="text-[10px] px-1.5 py-px leading-tight">{ind}</Badge>
              ))}
            </div>
          </div>
        </div>

        {(startup.location || startup.team_size || startup.year_founded) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
            {startup.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {startup.location}
              </span>
            )}
            {startup.team_size && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {startup.team_size}
              </span>
            )}
            {startup.year_founded && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {startup.year_founded}
              </span>
            )}
            {startup.tags && startup.tags.length > 0 && (
              <span className="text-muted-foreground/50 truncate max-w-[160px]">
                {startup.tags.slice(0, 3).join(' · ')}
              </span>
            )}
          </div>
        )}
      </div>

      {note && !showNoteEditor && (
        <div className="px-3 pb-1.5">
          <div
            className="flex items-start gap-1.5 text-[11px] text-muted-foreground/80 cursor-pointer hover:text-foreground transition-colors bg-muted/30 rounded-md px-2 py-1.5"
            onClick={handleToggleNote}
          >
            <MessageCircle className="h-3 w-3 shrink-0 mt-0.5 text-yc-orange" />
            <span className="line-clamp-1">{note.content}</span>
          </div>
        </div>
      )}

      <div className="flex items-center border-t mx-3">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-yc-orange transition-colors"
          onClick={handleToggleNote}
          title={note ? 'Edit note' : 'Add note'}
        >
          <MessageCircle className={`h-3.5 w-3.5 ${note ? 'text-yc-orange' : ''}`} />
          {note ? 'Note' : 'Note'}
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onViewDetail(startup)}
          title="View details"
        >
          <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center">
            <MoreHorizontal className="h-2.5 w-2.5" />
          </div>
          Details
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
          onClick={handleLike}
          title={liked ? 'Unlike' : 'Like'}
        >
          <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-red-500' : ''}`} />
          {liked ? 'Liked' : 'Like'}
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-colors ${bookmarked ? 'text-yc-orange' : 'text-muted-foreground hover:text-yc-orange'}`}
          onClick={handleBookmark}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? 'fill-yc-orange' : ''}`} />
          {bookmarked ? 'Saved' : 'Save'}
        </button>
      </div>

      {showNoteEditor && (
        <div ref={editorRef} className="px-3 py-2.5 space-y-2 bg-muted/20 rounded-b-xl border-t">
          <Textarea
            placeholder="Write a note..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="min-h-[56px] text-xs resize-none"
          />
          <div className="flex items-center justify-between">
            {note && (
              <span className="text-[10px] text-muted-foreground">
                Saved {new Date(note.updatedAt).toLocaleDateString()}
              </span>
            )}
            <Button size="sm" className="h-7 text-xs gap-1 ml-auto" onClick={handleSaveNote} disabled={savingNote}>
              <Save className="h-3 w-3" /> {savingNote ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import type { Note, Startup } from '../../lib/types'
import { getNotes, saveNotes } from '../../lib/storage'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { StickyNote, Clock, Save, CheckCircle2 } from 'lucide-react'

interface NoteEditorProps {
  startup: Startup
}

export function NoteEditor({ startup }: NoteEditorProps) {
  const [note, setNote] = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getNotes().then((notes) => {
      const existing = notes.find((n) => n.startupId === (startup.slug || startup.id))
      if (existing) {
        setNote(existing)
        setContent(existing.content)
      }
    })
  }, [startup])

  const handleSave = async () => {
    setSaving(true)
    const allNotes = await getNotes()
    const now = Date.now()
    const startupId = startup.slug || startup.id

    if (note) {
      const updated: Note = { ...note, content, updatedAt: now }
      const idx = allNotes.findIndex((n) => n.id === note.id)
      if (idx >= 0) allNotes[idx] = updated
      setNote(updated)
    } else {
      const newNote: Note = {
        id: `note-${startupId}-${now}`,
        startupId,
        content,
        createdAt: now,
        updatedAt: now,
      }
      allNotes.push(newNote)
      setNote(newNote)
    }

    await saveNotes(allNotes)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <StickyNote className="h-3 w-3 text-yc-orange" /> Notes
      </h4>
      <Textarea
        placeholder="Write your notes about this startup..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px] text-xs resize-none focus-visible:ring-yc-orange/30"
      />
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {note && (
            <>
              <Clock className="h-3 w-3" />
              <span>Saved {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="h-3 w-3" /> Saved
            </span>
          )}
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5 transition-all"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            {saving ? 'Saving...' : 'Save Note'}
          </Button>
        </div>
      </div>
    </div>
  )
}

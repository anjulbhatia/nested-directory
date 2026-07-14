import { useState, useEffect } from 'react'
import type { Note, Startup } from '../../lib/types'
import { getNotes, saveNotes } from '../../lib/storage'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { StickyNote, Clock, Save } from 'lucide-react'

interface NoteEditorProps {
  startup: Startup
}

export function NoteEditor({ startup }: NoteEditorProps) {
  const [note, setNote] = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

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
  }

  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <StickyNote className="h-3 w-3" /> Notes
      </h4>
      <Textarea
        placeholder="Write your notes about this startup..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px] text-xs resize-none"
      />
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          {note && (
            <>
              <Clock className="h-3 w-3" />
              Saved {new Date(note.updatedAt).toLocaleDateString()}
            </>
          )}
        </div>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={saving}>
          <Save className="h-3 w-3" /> {saving ? 'Saving...' : 'Save Note'}
        </Button>
      </div>
    </div>
  )
}

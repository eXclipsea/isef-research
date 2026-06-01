import { useEffect, useState } from 'react'
import type { Note } from '../../types'
import { getNoteBacklinks } from '../../api/notes'
import { useNotesStore } from '../../store/notesStore'

interface Props { noteId: string }

export function BacklinksPanel({ noteId }: Props) {
  const [backlinks, setBacklinks] = useState<Note[]>([])
  const { openTab } = useNotesStore()

  useEffect(() => { getNoteBacklinks(noteId).then(setBacklinks) }, [noteId])

  if (backlinks.length === 0) return null

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      padding: '10px 32px',
      background: 'var(--bg-base)',
      flexShrink: 0,
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
        Linked from
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {backlinks.map((note) => (
          <button
            key={note.id}
            onClick={() => openTab(note.id)}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-secondary)', fontSize: '13px',
              fontFamily: 'var(--font-serif)', cursor: 'pointer',
              textDecoration: 'underline', padding: 0,
            }}
          >
            {note.title}
          </button>
        ))}
      </div>
    </div>
  )
}

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
      borderTop: '1px solid var(--border-light)',
      padding: '10px 48px',
      background: 'var(--bg-base)',
      flexShrink: 0,
    }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontWeight: 600, marginBottom: '8px' }}>
        Linked mentions <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>· {backlinks.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {backlinks.map((note) => (
          <button
            key={note.id}
            onClick={() => openTab(note.id)}
            style={{
              background: 'none', border: 'none', textAlign: 'left',
              color: 'var(--accent-light)', fontSize: '13px',
              fontFamily: 'var(--font-ui)', cursor: 'pointer', padding: 0,
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
          >
            {note.title}
          </button>
        ))}
      </div>
    </div>
  )
}

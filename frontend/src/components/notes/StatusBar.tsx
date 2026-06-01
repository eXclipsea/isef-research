import { useEffect, useState } from 'react'
import { getNoteBacklinks } from '../../api/notes'
import { useNotesStore } from '../../store/notesStore'

interface Props { noteId: string | null }

export function StatusBar({ noteId }: Props) {
  const { stats } = useNotesStore()
  const [backlinks, setBacklinks] = useState(0)

  useEffect(() => {
    if (!noteId) { setBacklinks(0); return }
    getNoteBacklinks(noteId).then((b) => setBacklinks(b.length)).catch(() => setBacklinks(0))
  }, [noteId])

  return (
    <div style={{
      flexShrink: 0,
      height: '24px',
      borderTop: '1px solid var(--border-light)',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '16px',
      padding: '0 16px',
      fontSize: '12px',
      color: 'var(--text-faint)',
      fontFamily: 'var(--font-ui)',
    }}>
      {noteId && (
        <>
          <span>{backlinks} backlink{backlinks === 1 ? '' : 's'}</span>
          <span>{stats.words} word{stats.words === 1 ? '' : 's'}</span>
          <span>{stats.chars} character{stats.chars === 1 ? '' : 's'}</span>
        </>
      )}
    </div>
  )
}

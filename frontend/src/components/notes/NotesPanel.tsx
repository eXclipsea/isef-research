import { useEffect } from 'react'
import { useNotesStore } from '../../store/notesStore'
import { listNotes, getNote } from '../../api/notes'
import { NotesSidebar } from './NotesSidebar'
import { NoteEditor } from './NoteEditor'
import { BacklinksPanel } from './BacklinksPanel'

export function NotesPanel() {
  const { notes, selectedId, setNotes, upsertNote } = useNotesStore()

  useEffect(() => { listNotes().then(setNotes) }, [])

  useEffect(() => {
    if (selectedId) getNote(selectedId).then(upsertNote)
  }, [selectedId])

  const selectedNote = selectedId ? notes.find((n) => n.id === selectedId) : null

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <NotesSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-base)' }}>
        {selectedNote ? (
          <>
            <NoteEditor note={selectedNote} />
            <BacklinksPanel noteId={selectedNote.id} />
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', gap: '8px',
          }}>
            <div style={{ fontSize: '28px', lineHeight: 1 }}>✦</div>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              Select or create a note
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

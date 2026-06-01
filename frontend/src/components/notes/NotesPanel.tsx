import { useEffect } from 'react'
import { useNotesStore } from '../../store/notesStore'
import { listNotes, getNote } from '../../api/notes'
import { NotesSidebar } from './NotesSidebar'
import { NoteEditor } from './NoteEditor'
import { BacklinksPanel } from './BacklinksPanel'
import { TabBar } from './TabBar'
import { MindMap } from './MindMap'

export function NotesPanel() {
  const { notes, openTabs, activeTabId, view, setNotes, upsertNote } = useNotesStore()

  useEffect(() => { listNotes().then(setNotes) }, [])

  // load full content for any open tab that lacks it
  useEffect(() => {
    for (const id of openTabs) {
      const note = notes.find((n) => n.id === id)
      if (note && note.content === undefined) {
        getNote(id).then(upsertNote)
      }
    }
  }, [openTabs])

  const activeNote = activeTabId ? notes.find((n) => n.id === activeTabId) : null

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <NotesSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-base)', minWidth: 0 }}>
        <TabBar />

        {view === 'mindmap' ? (
          <MindMap />
        ) : activeNote && activeNote.content !== undefined ? (
          <>
            <NoteEditor key={activeNote.id} note={activeNote} />
            <BacklinksPanel noteId={activeNote.id} />
          </>
        ) : activeNote ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            Loading…
          </div>
        ) : (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', gap: '8px',
          }}>
            <div style={{ fontSize: '28px', lineHeight: 1 }}>✦</div>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              Select a note from the sidebar
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

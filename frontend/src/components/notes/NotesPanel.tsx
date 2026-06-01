import { useEffect } from 'react'
import { useNotesStore } from '../../store/notesStore'
import { listNotes, getNote } from '../../api/notes'
import { NotesSidebar } from './NotesSidebar'
import { NoteEditor } from './NoteEditor'
import { BacklinksPanel } from './BacklinksPanel'
import { TabBar } from './TabBar'
import { MindMap } from './MindMap'
import { StatusBar } from './StatusBar'

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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {view === 'mindmap' ? (
            <MindMap />
          ) : activeNote && activeNote.content !== undefined ? (
            <>
              <NoteEditor key={activeNote.id} note={activeNote} />
              <BacklinksPanel noteId={activeNote.id} />
            </>
          ) : activeNote ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontStyle: 'italic' }}>
              Loading…
            </div>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-faint)', gap: '10px',
            }}>
              <div style={{ fontSize: '32px', lineHeight: 1, opacity: 0.5 }}>✦</div>
              <div style={{ fontSize: '14px', fontFamily: 'var(--font-ui)' }}>
                No note open — pick one from the sidebar or press +
              </div>
            </div>
          )}
        </div>

        <StatusBar noteId={view === 'editor' && activeNote ? activeNote.id : null} />
      </div>
    </div>
  )
}

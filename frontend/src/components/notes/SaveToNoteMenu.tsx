import { useState } from 'react'
import { createNote, appendToNote } from '../../api/notes'
import { useNotesStore } from '../../store/notesStore'

interface Props {
  /** returns the markdown to save */
  getMarkdown: () => string
  title: string
  tags?: string[]
  label?: string
}

export function SaveToNoteMenu({ getMarkdown, title, tags = [], label = 'Save to note' }: Props) {
  const { notes, upsertNote, openTab } = useNotesStore()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  async function asNew() {
    setBusy(true)
    try {
      const note = await createNote({ title, content: getMarkdown(), tags })
      upsertNote(note)
      openTab(note.id)
      setDone('Created new note')
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  async function append(id: string) {
    setBusy(true)
    try {
      const note = await appendToNote(id, getMarkdown())
      upsertNote(note)
      openTab(note.id)
      setDone(`Appended to “${note.title}”`)
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => { setDone(null); setOpen((o) => !o) }}
        disabled={busy}
        style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: busy ? 'default' : 'pointer', fontSize: '12px', fontFamily: 'var(--font-ui)',
        }}
      >
        {busy ? 'Saving…' : done || `${label} ▾`}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: '4px', zIndex: 40,
            background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)', padding: '6px', minWidth: '200px',
            maxHeight: '300px', overflowY: 'auto',
          }}>
            <button onClick={asNew} style={item}>＋ New note</button>
            {notes.length > 0 && (
              <>
                <div style={{ fontSize: '10px', color: 'var(--text-faint)', padding: '6px 8px 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Append to
                </div>
                {notes.slice(0, 30).map((n) => (
                  <button key={n.id} onClick={() => append(n.id)} style={item}>
                    {n.title || 'Untitled'}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const item: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
  color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'var(--font-ui)',
  padding: '6px 8px', cursor: 'pointer', borderRadius: '4px',
  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
}

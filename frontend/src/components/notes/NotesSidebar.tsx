import { useState } from 'react'
import { useNotesStore } from '../../store/notesStore'
import { createNote } from '../../api/notes'

interface Props {
  onRefresh?: () => void
}

export function NotesSidebar({ onRefresh: _onRefresh }: Props) {
  const { notes, selectedId, selectNote, upsertNote } = useNotesStore()
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)))

  const displayed = activeTag
    ? notes.filter((n) => n.tags.includes(activeTag))
    : query
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          (n.content || '').toLowerCase().includes(query.toLowerCase())
      )
    : notes

  async function handleCreate() {
    if (!newTitle.trim()) return
    const note = await createNote({ title: newTitle.trim(), content: '', tags: [] })
    upsertNote(note)
    selectNote(note.id)
    setCreating(false)
    setNewTitle('')
  }

  return (
    <div style={{
      width: '240px',
      minWidth: '180px',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-panel)',
      flexShrink: 0,
    }}>
      {/* header */}
      <div style={{
        padding: '10px 14px 8px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Notes
        </span>
        <button
          onClick={() => setCreating(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}
          title="New note"
        >
          +
        </button>
      </div>

      {/* search */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-light)' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          style={{
            width: '100%',
            padding: '5px 8px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '2px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'var(--font-serif)',
            outline: 'none',
          }}
        />
      </div>

      {/* tags */}
      {allTags.length > 0 && (
        <div style={{ padding: '6px 10px', display: 'flex', flexWrap: 'wrap', gap: '4px', borderBottom: '1px solid var(--border-light)' }}>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              style={{
                padding: '1px 7px', borderRadius: '2px', fontSize: '11px',
                fontFamily: 'var(--font-serif)',
                background: activeTag === tag ? 'var(--bg-surface)' : 'transparent',
                border: '1px solid var(--border)',
                color: activeTag === tag ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* new note input */}
      {creating && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-light)' }}>
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') setCreating(false)
            }}
            placeholder="Note title..."
            style={{
              width: '100%', padding: '5px 8px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--text-muted)',
              borderRadius: '2px',
              color: 'var(--text-primary)', fontSize: '13px',
              fontFamily: 'var(--font-serif)', outline: 'none',
            }}
          />
        </div>
      )}

      {/* note list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {displayed.map((note) => (
          <div
            key={note.id}
            onClick={() => selectNote(note.id)}
            style={{
              padding: '7px 14px',
              cursor: 'pointer',
              borderBottom: '1px solid var(--border-light)',
              background: selectedId === note.id ? 'var(--bg-surface)' : 'transparent',
              borderLeft: `2px solid ${selectedId === note.id ? 'var(--text-secondary)' : 'transparent'}`,
            }}
            onMouseEnter={(e) => { if (selectedId !== note.id) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)' }}
            onMouseLeave={(e) => { if (selectedId !== note.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
          >
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {note.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}>
              {new Date(note.updated_at).toLocaleDateString()}
              {note.tags.length > 0 && ` · ${note.tags.map(t => '#' + t).join(' ')}`}
            </div>
          </div>
        ))}
        {displayed.length === 0 && (
          <div style={{ padding: '20px 14px', color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            No notes
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNotesStore } from '../../store/notesStore'
import { createNote, updateNote, deleteNote } from '../../api/notes'
import type { Note } from '../../types'

export function NotesSidebar() {
  const { notes, activeTabId, openTab, upsertNote, removeNote } = useNotesStore()
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [menuFor, setMenuFor] = useState<string | null>(null)

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)))
  const folders = Array.from(new Set(notes.map((n) => n.folder).filter(Boolean))) as string[]
  const filtering = !!(query || activeTag)

  const matches = (n: Note) =>
    activeTag
      ? n.tags.includes(activeTag)
      : query
      ? n.title.toLowerCase().includes(query.toLowerCase()) ||
        (n.content || '').toLowerCase().includes(query.toLowerCase())
      : true

  async function handleCreate() {
    if (!newTitle.trim()) return
    const note = await createNote({ title: newTitle.trim(), content: '', tags: [] })
    upsertNote(note)
    openTab(note.id)
    setCreating(false)
    setNewTitle('')
  }

  async function handleDelete(note: Note) {
    if (!confirm(`Delete "${note.title}"? This removes the .md file.`)) return
    await deleteNote(note.id)
    removeNote(note.id)
    setMenuFor(null)
  }

  async function moveTo(note: Note, folder: string | null) {
    upsertNote(await updateNote(note.id, { folder: folder ?? '' }))
    setMenuFor(null)
  }

  function toggleFolder(name: string) {
    setCollapsed((p) => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n })
  }

  const noteRow = (note: Note) => (
    <div
      key={note.id}
      onClick={() => openTab(note.id)}
      style={{
        position: 'relative',
        padding: '6px 10px 6px 14px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--border-light)',
        background: activeTabId === note.id ? 'var(--bg-surface)' : 'transparent',
        borderLeft: `2px solid ${activeTabId === note.id ? 'var(--accent)' : 'transparent'}`,
        display: 'flex', alignItems: 'center', gap: '6px',
      }}
      onMouseEnter={(e) => { if (activeTabId !== note.id) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)' }}
      onMouseLeave={(e) => { if (activeTabId !== note.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontFamily: 'var(--font-ui)', color: 'var(--text-primary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {note.title || 'Untitled'}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
          {new Date(note.updated_at).toLocaleDateString()}
          {note.tags.length > 0 && ` · ${note.tags.map((t) => '#' + t).join(' ')}`}
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === note.id ? null : note.id) }}
        title="Move / delete"
        style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '0 2px' }}
      >
        ⋯
      </button>

      {menuFor === note.id && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', right: '8px', top: '100%', zIndex: 20,
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: '6px', boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
            padding: '4px', minWidth: '150px',
          }}
        >
          <div style={{ fontSize: '10px', color: 'var(--text-faint)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Move to</div>
          {note.folder && (
            <button style={menuItem} onClick={() => moveTo(note, null)}>↑ Root (no folder)</button>
          )}
          {folders.filter((f) => f !== note.folder).map((f) => (
            <button key={f} style={menuItem} onClick={() => moveTo(note, f)}>📁 {f}</button>
          ))}
          <button
            style={menuItem}
            onClick={() => { const name = prompt('New folder name:'); if (name && name.trim()) moveTo(note, name.trim()) }}
          >
            + New folder…
          </button>
          <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
          <button style={{ ...menuItem, color: 'var(--red)' }} onClick={() => handleDelete(note)}>🗑 Delete note</button>
        </div>
      )}
    </div>
  )

  const visibleNotes = notes.filter(matches)
  const rootNotes = visibleNotes.filter((n) => !n.folder)

  return (
    <div style={{
      width: '250px', minWidth: '190px', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', background: 'var(--bg-panel)', flexShrink: 0,
    }}>
      {/* header */}
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Notes</span>
        <button onClick={() => setCreating(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 2px' }} title="New note">+</button>
      </div>

      {/* search */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-light)' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          style={{ width: '100%', padding: '5px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-ui)', outline: 'none' }}
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
                padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontFamily: 'var(--font-ui)',
                background: activeTag === tag ? 'rgba(167,139,250,0.15)' : 'transparent',
                border: `1px solid ${activeTag === tag ? 'var(--accent)' : 'var(--border)'}`,
                color: activeTag === tag ? 'var(--accent-light)' : 'var(--text-muted)', cursor: 'pointer',
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {creating && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-light)' }}>
          <input
            autoFocus value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
            placeholder="Note title..."
            style={{ width: '100%', padding: '5px 8px', background: 'var(--bg-surface)', border: '1px solid var(--accent)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-ui)', outline: 'none' }}
          />
        </div>
      )}

      {/* list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {visibleNotes.length === 0 && (
          <div style={{ padding: '20px 14px', color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-ui)', fontStyle: 'italic' }}>No notes</div>
        )}

        {/* folders (hidden while filtering, shown flat instead) */}
        {!filtering && folders.map((folder) => {
          const inFolder = visibleNotes.filter((n) => n.folder === folder)
          const isCollapsed = collapsed.has(folder)
          return (
            <div key={folder}>
              <div
                onClick={() => toggleFolder(folder)}
                style={{ padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-rail)', borderBottom: '1px solid var(--border-light)' }}
              >
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{isCollapsed ? '▸' : '▾'}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', flex: 1 }}>📁 {folder}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{inFolder.length}</span>
              </div>
              {!isCollapsed && inFolder.map(noteRow)}
            </div>
          )
        })}

        {/* root notes */}
        {rootNotes.map(noteRow)}
      </div>
    </div>
  )
}

const menuItem: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left', background: 'none',
  border: 'none', color: 'var(--text-secondary)', fontSize: '12px',
  fontFamily: 'var(--font-ui)', padding: '5px 8px', cursor: 'pointer', borderRadius: '4px',
}

import { useEffect, useRef, useCallback, useState } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import type { Note } from '../../types'
import { updateNote, deleteNote } from '../../api/notes'
import { useNotesStore } from '../../store/notesStore'

interface Props {
  note: Note
}

const obsidianTheme = EditorView.theme({
  '&': { height: '100%', background: 'transparent' },
  '.cm-scroller': {
    fontFamily: '"Times New Roman", Times, Georgia, serif',
    fontSize: '15px',
    lineHeight: '1.7',
    overflow: 'auto',
  },
  '.cm-content': { padding: '24px 32px', caretColor: '#fff' },
  '.cm-focused': { outline: 'none' },
  '.cm-line': { padding: '0' },
  '&.cm-focused .cm-cursor': { borderLeftColor: '#fff' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    background: 'rgba(255,255,255,0.1) !important',
  },
  '.cm-gutters': { display: 'none' },
  '.cm-activeLine': { background: 'rgba(255,255,255,0.03)' },
  // markdown heading styles
  '.cm-header-1': { fontSize: '1.6em', fontWeight: 'bold', color: '#fff' },
  '.cm-header-2': { fontSize: '1.3em', fontWeight: 'bold', color: '#e0e0e0' },
  '.cm-header-3': { fontSize: '1.1em', fontWeight: 'bold', color: '#ccc' },
  '.cm-strong': { color: '#fff', fontWeight: 'bold' },
  '.cm-em': { color: '#ccc', fontStyle: 'italic' },
  '.cm-link': { color: '#aaa', textDecoration: 'underline' },
  '.cm-url': { color: '#888' },
})

export function NoteEditor({ note }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { upsertNote, removeNote } = useNotesStore()
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState(note.tags)
  const [saved, setSaved] = useState(true)
  const [titleVal, setTitleVal] = useState(note.title)

  const save = useCallback(
    async (content: string) => {
      const updated = await updateNote(note.id, { content })
      upsertNote(updated)
      setSaved(true)
    },
    [note.id, upsertNote]
  )

  useEffect(() => {
    setTags(note.tags)
    setTitleVal(note.title)
  }, [note.id])

  useEffect(() => {
    if (!editorRef.current) return
    const state = EditorState.create({
      doc: note.content || '',
      extensions: [
        basicSetup,
        markdown(),
        obsidianTheme,
        EditorView.updateListener.of((update: { docChanged: boolean; state: { doc: { toString(): string } } }) => {
          if (update.docChanged) {
            setSaved(false)
            if (saveTimeout.current) clearTimeout(saveTimeout.current)
            saveTimeout.current = setTimeout(() => save(update.state.doc.toString()), 700)
          }
        }),
      ],
    })
    const view = new EditorView({ state, parent: editorRef.current })
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      view.destroy()
    }
  }, [note.id])

  async function handleAddTag(e: React.KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().replace(/,/g, '')
      const newTags = [...new Set([...tags, tag])]
      setTags(newTags)
      setTagInput('')
      upsertNote(await updateNote(note.id, { tags: newTags }))
    }
  }

  async function handleRemoveTag(tag: string) {
    const newTags = tags.filter((t) => t !== tag)
    setTags(newTags)
    upsertNote(await updateNote(note.id, { tags: newTags }))
  }

  async function handleDelete() {
    if (!confirm(`Delete "${note.title}"?`)) return
    await deleteNote(note.id)
    removeNote(note.id)
  }

  async function handleTitleBlur() {
    if (titleVal !== note.title) {
      upsertNote(await updateNote(note.id, { title: titleVal }))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* title bar */}
      <div style={{
        padding: '10px 32px 6px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-base)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <input
          value={titleVal}
          onChange={(e) => setTitleVal(e.target.value)}
          onBlur={handleTitleBlur}
          style={{
            flex: 1,
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '20px',
            fontWeight: 700,
            fontFamily: 'var(--font-serif)',
          }}
        />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}>
          {saved ? 'saved' : 'saving…'}
        </span>
        <button
          onClick={handleDelete}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-serif)' }}
        >
          delete
        </button>
      </div>

      {/* tags */}
      <div style={{
        padding: '5px 32px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-base)',
        flexShrink: 0,
        minHeight: '30px',
      }}>
        {tags.map((tag) => (
          <span
            key={tag}
            onClick={() => handleRemoveTag(tag)}
            style={{
              fontSize: '12px', fontFamily: 'var(--font-serif)',
              color: 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            #{tag} ×
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder={tags.length === 0 ? 'add tag…' : ''}
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--text-muted)', fontSize: '12px',
            fontFamily: 'var(--font-serif)', width: '80px',
          }}
        />
      </div>

      {/* editor */}
      <div ref={editorRef} style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-base)' }} />
    </div>
  )
}

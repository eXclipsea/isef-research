import { useEffect, useRef, useCallback, useState } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import type { Note } from '../../types'
import { updateNote, deleteNote } from '../../api/notes'
import { useNotesStore } from '../../store/notesStore'
import { livePreview } from './livePreview'

interface Props {
  note: Note
}

function countStats(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  return { words, chars: text.length }
}

const editorTheme = EditorView.theme({
  '&': { height: '100%', background: 'transparent', color: 'var(--text-primary)' },
})

export function NoteEditor({ note }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { upsertNote, removeNote, setStats } = useNotesStore()
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
    const initial = note.content || ''
    const s = countStats(initial)
    setStats(s.words, s.chars)

    const state = EditorState.create({
      doc: initial,
      extensions: [
        basicSetup,
        markdown(),
        livePreview,
        editorTheme,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const text = update.state.doc.toString()
            const st = countStats(text)
            setStats(st.words, st.chars)
            setSaved(false)
            if (saveTimeout.current) clearTimeout(saveTimeout.current)
            saveTimeout.current = setTimeout(() => save(text), 700)
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
      {/* inline title (Obsidian renders the filename as the H1) */}
      <div style={{ padding: '20px 48px 4px', flexShrink: 0 }}>
        <input
          value={titleVal}
          onChange={(e) => setTitleVal(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Untitled"
          style={{
            width: '100%', background: 'none', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontSize: '1.9em', fontWeight: 800,
            fontFamily: 'var(--font-ui)', letterSpacing: '-0.01em', lineHeight: 1.25,
          }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
          {tags.map((tag) => (
            <span
              key={tag}
              onClick={() => handleRemoveTag(tag)}
              style={{
                fontSize: '12px', fontFamily: 'var(--font-ui)',
                color: 'var(--accent-light)', background: 'rgba(167,139,250,0.12)',
                padding: '1px 8px', borderRadius: '10px', cursor: 'pointer',
              }}
              title="click to remove"
            >
              #{tag}
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder={tags.length === 0 ? 'add tag…' : '+'}
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-muted)', fontSize: '12px',
              fontFamily: 'var(--font-ui)', width: tags.length === 0 ? '70px' : '24px',
            }}
          />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontFamily: 'var(--font-ui)' }}>
            {saved ? '' : 'saving…'}
          </span>
          <button
            onClick={handleDelete}
            style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-ui)' }}
          >
            delete
          </button>
        </div>
      </div>

      {/* editor */}
      <div ref={editorRef} style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-base)' }} />
    </div>
  )
}

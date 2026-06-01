import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createNote } from '../../api/notes'
import { useNotesStore } from '../../store/notesStore'

interface Props { summary: string; query: string }

export function SearchSummary({ summary, query }: Props) {
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const { upsertNote } = useNotesStore()

  async function handleSaveToNote() {
    setSaving(true)
    const note = await createNote({ title: query, content: `# ${query}\n\n${summary}`, tags: ['search'] })
    upsertNote(note)
    setSaving(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{
      borderLeft: '2px solid var(--text-muted)',
      paddingLeft: '16px',
      marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-serif)' }}>
          AI Summary
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={handleCopy} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-serif)' }}>
          {copied ? 'copied' : 'copy'}
        </button>
        <button onClick={handleSaveToNote} disabled={saving} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-serif)' }}>
          {saving ? 'saving…' : 'save to note'}
        </button>
      </div>
      <div style={{ fontSize: '14px', lineHeight: '1.75', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
      </div>
    </div>
  )
}

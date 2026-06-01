import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SaveToNoteMenu } from '../notes/SaveToNoteMenu'

interface Props { summary: string; query: string }

export function SearchSummary({ summary, query }: Props) {
  const [copied, setCopied] = useState(false)

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
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-ui)' }}>
          AI Summary
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={handleCopy} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-ui)' }}>
          {copied ? 'copied' : 'copy'}
        </button>
        <SaveToNoteMenu
          title={query}
          tags={['search']}
          getMarkdown={() => `# ${query}\n\n${summary}`}
        />
      </div>
      <div className="prose-md" style={{ fontSize: '15px', lineHeight: '1.65', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
      </div>
    </div>
  )
}

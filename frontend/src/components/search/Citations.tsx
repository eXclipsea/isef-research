import { useState } from 'react'
import type { PaperResult, WebResult } from '../../types'
import { SaveToNoteMenu } from '../notes/SaveToNoteMenu'

interface Props {
  papers: PaperResult[]
  web: WebResult[]
  query: string
}

function isPaper(s: PaperResult | WebResult): s is PaperResult {
  return 'authors' in s
}

// Best-effort APA-style citation from the metadata we already have.
function formatAPA(s: PaperResult | WebResult): string {
  if (isPaper(s)) {
    const authors = s.authors.length
      ? s.authors.slice(0, 3).join(', ') + (s.authors.length > 3 ? ', et al.' : '')
      : 'Unknown author'
    const year = s.year ? ` (${s.year}).` : ' (n.d.).'
    const title = s.title ? ` ${s.title}.` : ''
    const src = s.source ? ` ${s.source}.` : ''
    const doi = s.doi ? ` https://doi.org/${s.doi}` : s.url ? ` ${s.url}` : ''
    return `${authors}${year}${title}${src}${doi}`.trim()
  }
  let host = ''
  try { host = new URL(s.url).hostname.replace(/^www\./, '') } catch { /* ignore */ }
  const title = s.title || 'Untitled'
  return `${title}. ${host ? host + '. ' : ''}Retrieved from ${s.url}`.trim()
}

export function Citations({ papers, web, query }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const all = [...papers, ...web]
  if (all.length === 0) return null
  const lines = all.map(formatAPA)

  function copyAll() {
    navigator.clipboard.writeText(lines.join('\n\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function markdown() {
    return `# References — ${query}\n\n` + lines.map((l) => `- ${l}`).join('\n')
  }

  return (
    <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: open ? '10px' : 0 }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: '12px', fontFamily: 'var(--font-ui)', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px', padding: 0,
          }}
        >
          <span style={{ fontSize: '10px' }}>{open ? '▾' : '▸'}</span>
          Citations — {all.length} (APA)
        </button>
        <div style={{ flex: 1 }} />
        {open && (
          <>
            <button onClick={copyAll} style={linkBtn}>{copied ? 'copied' : 'copy all'}</button>
            <SaveToNoteMenu title={`References — ${query}`} tags={['references']} getMarkdown={markdown} label="save references" />
          </>
        )}
      </div>

      {open && (
        <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {lines.map((line, i) => (
            <li key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', lineHeight: 1.55 }}>
              {line}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--text-muted)',
  cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-ui)',
}

import { useState } from 'react'
import { getCitation } from '../../api/documents'

interface Props { docId: string }
type Style = 'apa' | 'mla' | 'chicago'

export function CitationCard({ docId }: Props) {
  const [style, setStyle] = useState<Style>('apa')
  const [citation, setCitation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function fetchCitation(s: Style) {
    setStyle(s)
    setLoading(true)
    setCitation(await getCitation(docId, s))
    setLoading(false)
  }

  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: citation ? '8px' : 0 }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Citation</span>
        {(['apa', 'mla', 'chicago'] as Style[]).map((s) => (
          <button
            key={s}
            onClick={() => fetchCitation(s)}
            style={{
              background: 'none', border: 'none',
              padding: '0 0 1px',
              fontSize: '11px', fontFamily: 'var(--font-serif)',
              color: style === s && citation ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer', textTransform: 'uppercase',
              borderBottom: `1px solid ${style === s && citation ? 'var(--text-primary)' : 'transparent'}`,
            }}
          >
            {s}
          </button>
        ))}
      </div>
      {loading && <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Fetching…</div>}
      {citation && !loading && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', lineHeight: '1.5' }}>
          {citation}
          <button
            onClick={() => { navigator.clipboard.writeText(citation); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-serif)', marginLeft: '8px' }}
          >
            {copied ? 'copied' : 'copy'}
          </button>
        </div>
      )}
    </div>
  )
}

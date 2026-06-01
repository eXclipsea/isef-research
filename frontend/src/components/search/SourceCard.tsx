import { useState } from 'react'
import type { PaperResult, WebResult } from '../../types'
import { getCitationFromDoi, getPdfFromDoi } from '../../api/search'

interface Props {
  source: PaperResult | WebResult
  index: number
  selected?: boolean
  onToggle?: () => void
}

function isPaper(s: PaperResult | WebResult): s is PaperResult {
  return 'authors' in s
}

export function SourceCard({ source, index, selected, onToggle }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [citation, setCitation] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const paper = isPaper(source) ? source : null
  const snippet = paper?.abstract || (source as WebResult).snippet || ''

  async function handleCitation() {
    if (citation) { setCitation(null); return }
    if (paper?.doi) {
      const c = await getCitationFromDoi(paper.doi)
      setCitation(c || buildFallback())
    } else if (paper) {
      setCitation(buildFallback())
    }
  }

  function buildFallback() {
    if (!paper) return ''
    const authors = paper.authors.slice(0, 3).join(', ') + (paper.authors.length > 3 ? ', et al.' : '')
    return `${authors} (${paper.year || 'n.d.'}). ${paper.title}. ${paper.source}.`
  }

  async function openPdf() {
    if (paper?.pdf_url) { window.open(paper.pdf_url, '_blank'); return }
    if (paper?.doi) {
      const url = await getPdfFromDoi(paper.doi)
      if (url) window.open(url, '_blank')
    }
  }

  return (
    <div style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        {onToggle && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onToggle}
            style={{ marginTop: '3px', flexShrink: 0, accentColor: '#fff', cursor: 'pointer' }}
          />
        )}
        <span style={{ flexShrink: 0, fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', paddingTop: '2px', minWidth: '20px' }}>
          [{index}]
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <a
            href={source.url} target="_blank" rel="noreferrer"
            style={{ fontSize: '14px', fontFamily: 'var(--font-ui)', color: 'var(--text-primary)', textDecoration: 'underline', textDecorationColor: 'var(--border)', display: 'block', marginBottom: '2px' }}
          >
            {source.title}
          </a>

          {paper && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginBottom: '3px' }}>
              {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}
              {paper.year && ` · ${paper.year}`}
              {` · ${paper.source}`}
            </div>
          )}

          {!paper && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginBottom: '3px' }}>
              {source.url}
            </div>
          )}

          {snippet && (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', lineHeight: '1.5' }}>
              {expanded ? snippet : snippet.slice(0, 180) + (snippet.length > 180 ? '…' : '')}
              {snippet.length > 180 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-ui)', marginLeft: '4px', padding: 0 }}
                >
                  {expanded ? 'less' : 'more'}
                </button>
              )}
            </div>
          )}

          {citation && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--bg-surface)', borderLeft: '2px solid var(--border)', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', fontStyle: 'italic', lineHeight: '1.5' }}>
              {citation}
              <button
                onClick={() => { navigator.clipboard.writeText(citation); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-ui)', marginLeft: '8px' }}
              >
                {copied ? 'copied' : 'copy'}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 }}>
          {paper && (paper.doi || paper.pdf_url) && (
            <button onClick={handleCitation} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-ui)' }}>
              cite
            </button>
          )}
          {paper && (paper.pdf_url || paper.doi) && (
            <button onClick={openPdf} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--font-ui)' }}>
              pdf
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { doSearch, generateTopics } from '../../api/search'
import { createNote } from '../../api/notes'
import { useNotesStore } from '../../store/notesStore'
import type { SearchResponse, PaperResult, WebResult, TopicsResult } from '../../types'
import { SearchSummary } from './SearchSummary'
import { SourceCard } from './SourceCard'

type Mode = 'all' | 'web' | 'papers'
type Status = 'idle' | 'loading' | 'done'

export function SearchPanel() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<Mode>('all')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<SearchResponse | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [topics, setTopics] = useState<TopicsResult | null>(null)
  const [topicsLoading, setTopicsLoading] = useState(false)
  const { openTab, upsertNote } = useNotesStore()

  const combined: (PaperResult | WebResult)[] = result
    ? [...result.paper_results, ...result.web_results]
    : []

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setStatus('loading')
    setResult(null)
    setSelected(new Set())
    setTopics(null)
    try {
      setResult(await doSearch(query, mode))
    } finally {
      setStatus('done')
    }
  }

  function toggle(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  async function handleGenerateTopics() {
    const chosen = [...selected].map((i) => combined[i]).filter(Boolean)
    if (chosen.length === 0) return
    setTopicsLoading(true)
    setTopics(null)
    try {
      const payload = chosen.map((s) => ({
        title: s.title,
        url: s.url,
        snippet: 'snippet' in s ? s.snippet : '',
        abstract: 'abstract' in s ? s.abstract : '',
      }))
      setTopics(await generateTopics(query, payload))
    } finally {
      setTopicsLoading(false)
    }
  }

  async function saveTopicsToNote() {
    if (!topics) return
    const body = `# ${query} — Key Topics\n\n${topics.overview}\n\n${topics.topics.map((t) => `- ${t}`).join('\n')}`
    const note = await createNote({ title: `${query} — Key Topics`, content: body, tags: ['research'] })
    upsertNote(note)
    openTab(note.id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      {/* search bar */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', flexShrink: 0 }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search papers, web, or both…"
              style={{
                flex: 1, padding: '8px 12px', background: 'var(--bg-base)',
                border: '1px solid var(--border)', borderRadius: '2px',
                color: 'var(--text-primary)', fontSize: '14px',
                fontFamily: 'var(--font-ui)', outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                padding: '8px 18px',
                background: status === 'loading' ? 'var(--bg-surface)' : 'var(--text-primary)',
                border: 'none', borderRadius: '2px', color: 'var(--bg-base)',
                fontSize: '14px', fontFamily: 'var(--font-ui)',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer', fontWeight: 700,
              }}
            >
              {status === 'loading' ? '…' : 'Search'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {(['all', 'web', 'papers'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  background: 'none', border: 'none', padding: '0 0 2px',
                  fontSize: '12px', fontFamily: 'var(--font-ui)',
                  color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${mode === m ? 'var(--text-primary)' : 'transparent'}`,
                  textTransform: 'capitalize',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* results area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '70px 0', gap: '14px' }}>
            <div style={{
              width: '20px', height: '20px',
              border: '2px solid var(--border)', borderTopColor: 'var(--text-primary)',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: 'var(--font-ui)', fontStyle: 'italic' }}>
              Searching sources & synthesising…
            </div>
          </div>
        )}

        {status === 'idle' && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '80px 0', fontSize: '14px', fontFamily: 'var(--font-ui)', fontStyle: 'italic' }}>
            Enter a query to search
          </div>
        )}

        {status === 'done' && result && (
          <>
            <SearchSummary summary={result.summary} query={query} />

            {/* key topics output */}
            {(topicsLoading || topics) && (
              <div style={{ marginTop: '20px', borderLeft: '2px solid var(--text-primary)', paddingLeft: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-ui)' }}>
                    Key Topics
                  </span>
                  {topics && (
                    <button onClick={saveTopicsToNote} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-ui)' }}>
                      save to note
                    </button>
                  )}
                </div>
                {topicsLoading ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-ui)', fontStyle: 'italic' }}>
                    Reading {selected.size} sources & extracting topics…
                  </div>
                ) : topics && (
                  <>
                    {topics.overview && (
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', lineHeight: 1.6, marginBottom: '10px' }}>
                        {topics.overview}
                      </div>
                    )}
                    {topics.topics.map((t, i) => (
                      <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', lineHeight: 1.6, padding: '2px 0' }}>
                        — {t}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {result.paper_results.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-ui)', marginBottom: '10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
                  Papers — {result.paper_results.length}
                </div>
                {result.paper_results.map((p, i) => (
                  <SourceCard key={i} source={p} index={i + 1} selected={selected.has(i)} onToggle={() => toggle(i)} />
                ))}
              </div>
            )}

            {result.web_results.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-ui)', marginBottom: '10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
                  Web — {result.web_results.length}
                </div>
                {result.web_results.map((w, i) => {
                  const idx = result.paper_results.length + i
                  return (
                    <SourceCard key={i} source={w} index={idx + 1} selected={selected.has(idx)} onToggle={() => toggle(idx)} />
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* sticky action bar when sources selected */}
      {status === 'done' && selected.size > 0 && (
        <div style={{
          flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--bg-panel)',
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
            {selected.size} source{selected.size === 1 ? '' : 's'} selected
          </span>
          <button onClick={() => setSelected(new Set())} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-ui)' }}>
            clear
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={handleGenerateTopics}
            disabled={topicsLoading}
            style={{
              padding: '7px 16px',
              background: topicsLoading ? 'var(--bg-surface)' : 'var(--text-primary)',
              border: 'none', borderRadius: '2px', color: 'var(--bg-base)',
              fontSize: '13px', fontFamily: 'var(--font-ui)', fontWeight: 700,
              cursor: topicsLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {topicsLoading ? 'Generating…' : 'Generate key topics'}
          </button>
        </div>
      )}
    </div>
  )
}

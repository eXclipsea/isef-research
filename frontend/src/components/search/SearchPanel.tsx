import { useState } from 'react'
import { doSearch } from '../../api/search'
import { addPapersToResearch } from '../../api/documents'
import { useDocumentsStore } from '../../store/documentsStore'
import type { SearchResponse, PaperResult, WebResult } from '../../types'
import { SearchSummary } from './SearchSummary'
import { SourceCard } from './SourceCard'
import { ResearchAssistant } from './ResearchAssistant'
import { Citations } from './Citations'

type Mode = 'all' | 'web' | 'papers'
type Status = 'idle' | 'loading' | 'done'
type View = 'search' | 'assistant'

export function SearchPanel() {
  const [view, setView] = useState<View>('search')
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<Mode>('all')
  const [numResults, setNumResults] = useState(30)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<SearchResponse | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState<number | null>(null)
  const { addDocs } = useDocumentsStore()

  const combined: (PaperResult | WebResult)[] = result
    ? [...result.paper_results, ...result.web_results]
    : []

  async function runSearch(q: string, m: Mode = mode) {
    if (!q.trim()) return
    setView('search')
    setQuery(q)
    setStatus('loading')
    setResult(null)
    setSelected(new Set())
    setError(null)
    setAdded(null)
    try {
      setResult(await doSearch(q, m, numResults))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Search failed. Is the backend running?')
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

  async function handleAddToResearch() {
    const chosen = [...selected].map((i) => combined[i]).filter(Boolean)
    if (chosen.length === 0) return
    setAdding(true)
    setAdded(null)
    try {
      const docs = await addPapersToResearch(chosen)
      addDocs(docs)
      setAdded(docs.length)
      setSelected(new Set())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not add to Research.')
    } finally {
      setAdding(false)
    }
  }

  const tab = (id: View, label: string) => (
    <button
      onClick={() => setView(id)}
      style={{
        background: 'none', border: 'none', padding: '0 0 3px', fontSize: '13px',
        fontFamily: 'var(--font-ui)', cursor: 'pointer',
        color: view === id ? 'var(--text-primary)' : 'var(--text-muted)',
        borderBottom: `2px solid ${view === id ? 'var(--accent)' : 'transparent'}`,
        fontWeight: view === id ? 600 : 400,
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>
      {/* view tabs */}
      <div style={{ display: 'flex', gap: '18px', padding: '10px 16px 0', background: 'var(--bg-panel)', flexShrink: 0 }}>
        {tab('search', 'Search')}
        {tab('assistant', 'Plan my research')}
      </div>

      {view === 'assistant' ? (
        <ResearchAssistant onRunSearch={(q) => runSearch(q)} />
      ) : (
        <>
          {/* search bar */}
          <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', flexShrink: 0 }}>
            <form onSubmit={(e) => { e.preventDefault(); runSearch(query) }}>
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
                    background: status === 'loading' ? 'var(--bg-surface)' : 'var(--accent)',
                    border: 'none', borderRadius: '2px', color: '#fff',
                    fontSize: '14px', fontFamily: 'var(--font-ui)',
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer', fontWeight: 600,
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
                <div style={{ flex: 1 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
                  results
                  <select
                    value={numResults}
                    onChange={(e) => setNumResults(Number(e.target.value))}
                    style={{
                      background: 'var(--bg-base)', color: 'var(--text-secondary)',
                      border: '1px solid var(--border)', borderRadius: '4px',
                      fontSize: '12px', fontFamily: 'var(--font-ui)', padding: '1px 4px', outline: 'none',
                    }}
                  >
                    {[20, 30, 50, 80].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </div>
            </form>
          </div>

          {/* results */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {status === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '70px 0', gap: '14px' }}>
                <div style={{ width: '20px', height: '20px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: 'var(--font-ui)', fontStyle: 'italic' }}>
                  Searching sources & synthesising…
                </div>
              </div>
            )}

            {status === 'idle' && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '80px 0', fontSize: '14px', fontFamily: 'var(--font-ui)', fontStyle: 'italic' }}>
                Search the web and scholarly papers — then select sources to send to Research.
              </div>
            )}

            {status === 'done' && error && (
              <div style={{ border: '1px solid var(--red)', borderRadius: '6px', padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'var(--font-ui)', lineHeight: 1.5, background: 'rgba(224,97,111,0.06)' }}>
                <strong style={{ color: 'var(--red)' }}>Search failed.</strong> {error}
              </div>
            )}

            {status === 'done' && result && (
              <>
                {result.warnings && result.warnings.length > 0 && (
                  <div style={{ border: '1px solid var(--border)', borderLeft: '2px solid var(--yellow)', borderRadius: '4px', padding: '8px 12px', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-ui)', lineHeight: 1.5 }}>
                    {result.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
                  </div>
                )}
                <SearchSummary summary={result.summary} query={query} />

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

                <Citations papers={result.paper_results} web={result.web_results} query={query} />
              </>
            )}
          </div>

          {/* sticky action bar: Add to Research */}
          {status === 'done' && (selected.size > 0 || added !== null) && (
            <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--bg-panel)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {added !== null && selected.size === 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--green)', fontFamily: 'var(--font-ui)' }}>
                  ✓ Added {added} to Research — open the Research panel to generate key topics.
                </span>
              ) : (
                <>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
                    {selected.size} selected
                  </span>
                  <button onClick={() => setSelected(new Set())} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-ui)' }}>
                    clear
                  </button>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={handleAddToResearch}
                    disabled={adding}
                    style={{
                      padding: '7px 16px',
                      background: adding ? 'var(--bg-surface)' : 'var(--accent)',
                      border: 'none', borderRadius: '2px', color: '#fff',
                      fontSize: '13px', fontFamily: 'var(--font-ui)', fontWeight: 600,
                      cursor: adding ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {adding ? 'Adding…' : `Add ${selected.size} to Research →`}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

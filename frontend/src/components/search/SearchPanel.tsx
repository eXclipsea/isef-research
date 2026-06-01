import { useState } from 'react'
import { doSearch } from '../../api/search'
import type { SearchResponse } from '../../types'
import { SearchSummary } from './SearchSummary'
import { SourceCard } from './SourceCard'

type Mode = 'all' | 'web' | 'papers'

export function SearchPanel() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<Mode>('all')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResponse | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      setResult(await doSearch(query, mode))
    } finally {
      setLoading(false)
    }
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
                flex: 1, padding: '8px 12px',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: '2px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'var(--font-serif)',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 18px',
                background: loading ? 'var(--bg-surface)' : 'var(--text-primary)',
                border: 'none',
                borderRadius: '2px',
                color: 'var(--bg-base)',
                fontSize: '14px',
                fontFamily: 'var(--font-serif)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 700,
              }}
            >
              {loading ? '…' : 'Search'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {(['all', 'web', 'papers'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  background: 'none', border: 'none',
                  padding: '0 0 2px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-serif)',
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

      {/* results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0', fontSize: '14px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            Searching & synthesising…
          </div>
        )}

        {!loading && result && (
          <>
            <SearchSummary summary={result.summary} query={query} />

            {result.paper_results.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-serif)', marginBottom: '10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
                  Papers — {result.paper_results.length}
                </div>
                {result.paper_results.map((p, i) => (
                  <SourceCard key={i} source={p} index={i + 1} />
                ))}
              </div>
            )}

            {result.web_results.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-serif)', marginBottom: '10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
                  Web — {result.web_results.length}
                </div>
                {result.web_results.map((w, i) => (
                  <SourceCard key={i} source={w} index={result.paper_results.length + i + 1} />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !result && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '80px 0', fontSize: '14px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            Enter a query to search
          </div>
        )}
      </div>
    </div>
  )
}

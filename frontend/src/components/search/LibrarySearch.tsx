import { useState } from 'react'
import { searchLibrary } from '../../api/documents'
import { searchNotes } from '../../api/notes'
import { useNotesStore } from '../../store/notesStore'
import type { DocHit, Note } from '../../types'

export function LibrarySearch() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [docHits, setDocHits] = useState<DocHit[]>([])
  const [noteHits, setNoteHits] = useState<Note[]>([])
  const [ran, setRan] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { openTab } = useNotesStore()

  async function run(e: React.FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    try {
      const [docs, notes] = await Promise.all([
        searchLibrary(q).catch((er) => { throw er }),
        searchNotes(q).catch(() => [] as Note[]),
      ])
      setDocHits(docs)
      setNoteHits(notes)
      setRan(true)
    } catch (er: unknown) {
      setError(er instanceof Error ? er.message : 'Library search failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', flexShrink: 0 }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ background: 'rgba(78,201,143,0.15)', color: 'var(--green)', borderRadius: '10px', padding: '1px 8px', fontSize: '11px' }}>● works offline</span>
          Search your saved papers, PDFs and notes — no internet needed.
        </div>
        <form onSubmit={run} style={{ display: 'flex', gap: '8px' }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your library…"
            style={{
              flex: 1, padding: '8px 12px', background: 'var(--bg-base)',
              border: '1px solid var(--border)', borderRadius: '2px',
              color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-ui)', outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '8px 18px', background: loading ? 'var(--bg-surface)' : 'var(--accent)',
              border: 'none', borderRadius: '2px', color: '#fff', fontSize: '14px',
              fontFamily: 'var(--font-ui)', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '…' : 'Search'}
          </button>
        </form>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {error && (
          <div style={{ border: '1px solid var(--red)', borderRadius: '6px', padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'var(--font-ui)', background: 'rgba(224,97,111,0.06)' }}>
            {error}
          </div>
        )}

        {!ran && !error && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '70px 0', fontSize: '14px', fontFamily: 'var(--font-ui)', fontStyle: 'italic' }}>
            Search everything you've already collected.
          </div>
        )}

        {ran && !loading && docHits.length === 0 && noteHits.length === 0 && !error && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '13px', fontFamily: 'var(--font-ui)', fontStyle: 'italic' }}>
            Nothing found. Add papers/PDFs in Research or write some notes first.
          </div>
        )}

        {docHits.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-ui)', marginBottom: '10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
              In your documents — {docHits.length}
            </div>
            {docHits.map((h, i) => (
              <div key={i} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
                  {h.title}
                  <span style={{ fontWeight: 400, color: 'var(--text-faint)', marginLeft: '8px', fontSize: '11px' }}>
                    {h.kind === 'paper' ? 'paper' : 'pdf'}{h.page ? ` · p.${h.page}` : ''}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', lineHeight: 1.55, marginTop: '3px' }}>
                  …{h.snippet}…
                </div>
              </div>
            ))}
          </div>
        )}

        {noteHits.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-ui)', marginBottom: '10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
              In your notes — {noteHits.length}
            </div>
            {noteHits.map((n) => (
              <button
                key={n.id}
                onClick={() => openTab(n.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '7px 0', borderBottom: '1px solid var(--border-light)',
                }}
              >
                <div style={{ fontSize: '13px', color: 'var(--accent-light)', fontFamily: 'var(--font-ui)' }}>{n.title || 'Untitled'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {(n.content || '').slice(0, 120)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

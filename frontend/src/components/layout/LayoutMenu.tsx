import { useState } from 'react'
import { useLayoutStore } from '../../store/layoutStore'
import type { PanelId } from '../../types'

type Cols = PanelId[][]

interface Preset {
  label: string
  columns: Cols
  diagram: string // tiny ascii hint of the arrangement
}

const PRESETS: Preset[] = [
  { label: 'Three columns', columns: [['notes'], ['search'], ['documents']], diagram: '▯ ▯ ▯' },
  { label: 'Search over Research', columns: [['notes'], ['search', 'documents']], diagram: '▯ ⬓' },
  { label: 'Notes + stacked right', columns: [['notes'], ['search', 'documents']], diagram: '▯ ⬓' },
  { label: 'Research over Search', columns: [['notes'], ['documents', 'search']], diagram: '▯ ⬓' },
  { label: 'Two columns', columns: [['notes'], ['search']], diagram: '▯ ▯' },
  { label: 'Single — Notes', columns: [['notes']], diagram: '▮' },
]

export function LayoutMenu() {
  const { setColumns } = useLayoutStore()
  const [open, setOpen] = useState(false)

  // de-dup presets that produce the same columns (the two "stacked right" share layout)
  const unique = PRESETS.filter(
    (p, i) => PRESETS.findIndex((q) => JSON.stringify(q.columns) === JSON.stringify(p.columns)) === i
  )

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: open ? 'var(--bg-surface)' : 'transparent', border: 'none',
          borderRadius: '5px', padding: '3px 10px', fontSize: '13px',
          fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', cursor: 'pointer',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
        title="Arrange panels"
      >
        ▦ Layout
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: '4px', zIndex: 40,
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
            padding: '6px', minWidth: '210px',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-faint)', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Arrange panels
            </div>
            {unique.map((p) => (
              <button
                key={p.label}
                onClick={() => { setColumns(p.columns); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                  textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '7px 8px', borderRadius: '5px', color: 'var(--text-secondary)',
                  fontSize: '13px', fontFamily: 'var(--font-ui)',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
              >
                <span style={{ fontSize: '14px', color: 'var(--accent-light)', width: '38px', letterSpacing: '1px' }}>{p.diagram}</span>
                {p.label}
              </button>
            ))}
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', padding: '6px 8px 2px', lineHeight: 1.4 }}>
              Tip: drag a panel's title onto another to stack them, or drag the dividers to resize.
            </div>
          </div>
        </>
      )}
    </div>
  )
}

import { useLayoutStore } from '../../store/layoutStore'
import type { PanelId } from '../../types'

const PANELS: { id: PanelId; label: string }[] = [
  { id: 'notes', label: 'Notes' },
  { id: 'search', label: 'Search' },
  { id: 'documents', label: 'Research' },
]

export function PanelControls() {
  const { columns, togglePanel } = useLayoutStore()
  const activeIds = columns.flat()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {PANELS.map(({ id, label }) => {
        const active = activeIds.includes(id)
        return (
          <button
            key={id}
            onClick={() => togglePanel(id)}
            style={{
              padding: '3px 12px',
              borderRadius: '5px',
              fontSize: '13px',
              fontFamily: 'var(--font-ui)',
              border: 'none',
              background: active ? 'var(--bg-surface)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

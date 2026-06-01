import { useLayoutStore } from '../../store/layoutStore'
import type { PanelId } from '../../types'

const PANELS: { id: PanelId; label: string }[] = [
  { id: 'notes', label: 'Notes' },
  { id: 'search', label: 'Search' },
  { id: 'documents', label: 'Research' },
]

export function PanelControls() {
  const { activePanels, togglePanel } = useLayoutStore()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {PANELS.map(({ id, label }) => {
        const active = activePanels.includes(id)
        return (
          <button
            key={id}
            onClick={() => togglePanel(id)}
            style={{
              padding: '3px 12px',
              borderRadius: '2px',
              fontSize: '13px',
              fontFamily: 'var(--font-serif)',
              border: '1px solid transparent',
              background: active ? 'var(--bg-surface)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              borderColor: active ? 'var(--border)' : 'transparent',
              letterSpacing: '0.01em',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

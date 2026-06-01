import type { ReactNode } from 'react'
import { useLayoutStore } from '../../store/layoutStore'
import type { PanelId } from '../../types'

const LABELS: Record<PanelId, string> = {
  notes: 'Notes',
  search: 'Search',
  documents: 'Research',
}

interface Props {
  id: PanelId
  canStackLeft: boolean
  canSplitOut: boolean
  children: ReactNode
}

export function PanelFrame({ id, canStackLeft, canSplitOut, children }: Props) {
  const { stackLeft, splitOut, togglePanel } = useLayoutStore()

  const btn = (label: string, title: string, onClick: () => void) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'none', border: 'none', color: 'var(--text-faint)',
        cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-ui)',
        padding: '0 4px', lineHeight: 1,
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-faint)')}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <div style={{
        height: '26px', flexShrink: 0, display: 'flex', alignItems: 'center',
        padding: '0 8px 0 12px', background: 'var(--bg-rail)',
        borderBottom: '1px solid var(--border)', gap: '4px',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', flex: 1 }}>
          {LABELS[id]}
        </span>
        {canStackLeft && btn('⤡ stack', 'Stack under the column to the left', () => stackLeft(id))}
        {canSplitOut && btn('⤢ split', 'Move to its own column', () => splitOut(id))}
        {btn('✕', 'Close panel', () => togglePanel(id))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}

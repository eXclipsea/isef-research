import { useState, type ReactNode } from 'react'
import { useLayoutStore } from '../../store/layoutStore'
import type { PanelId } from '../../types'

const LABELS: Record<PanelId, string> = {
  notes: 'Notes',
  search: 'Search',
  documents: 'Research',
}

interface Props {
  id: PanelId
  colIdx: number
  canStackLeft: boolean
  canSplitOut: boolean
  children: ReactNode
}

export function PanelFrame({ id, colIdx, canStackLeft, canSplitOut, children }: Props) {
  const { stackLeft, splitOut, togglePanel, movePanel } = useLayoutStore()
  const [dropActive, setDropActive] = useState(false)

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

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDropActive(false)
    const draggedId = e.dataTransfer.getData('text/panel-id') as PanelId
    if (draggedId && draggedId !== id) {
      movePanel(draggedId, { col: colIdx, stack: true })
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDropActive(true) }}
      onDragLeave={() => setDropActive(false)}
      onDrop={onDrop}
      style={{
        display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
        overflow: 'hidden', position: 'relative',
        outline: dropActive ? '2px solid var(--accent)' : 'none', outlineOffset: '-2px',
      }}
    >
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/panel-id', id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        style={{
          height: '26px', flexShrink: 0, display: 'flex', alignItems: 'center',
          padding: '0 8px 0 12px', background: 'var(--bg-rail)',
          borderBottom: '1px solid var(--border)', gap: '4px', cursor: 'grab',
        }}
        title="Drag onto another panel to stack"
      >
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

      {dropActive && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(167,139,250,0.08)',
          pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ background: 'var(--accent)', color: '#fff', fontSize: '12px', fontFamily: 'var(--font-ui)', padding: '4px 10px', borderRadius: '6px' }}>
            Stack here
          </span>
        </div>
      )}
    </div>
  )
}

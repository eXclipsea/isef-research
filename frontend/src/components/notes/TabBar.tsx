import { useNotesStore } from '../../store/notesStore'

export function TabBar() {
  const { notes, openTabs, activeTabId, setActiveTab, closeTab, view, setView } = useNotesStore()

  if (openTabs.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-panel)',
      flexShrink: 0,
      height: '32px',
      overflowX: 'auto',
    }}>
      {openTabs.map((id) => {
        const note = notes.find((n) => n.id === id)
        if (!note) return null
        const active = activeTabId === id && view === 'editor'
        return (
          <div
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 10px',
              maxWidth: '160px',
              cursor: 'pointer',
              borderRight: '1px solid var(--border)',
              background: active ? 'var(--bg-base)' : 'transparent',
              borderBottom: active ? '1px solid var(--bg-base)' : '1px solid transparent',
              marginBottom: '-1px',
              flexShrink: 0,
            }}
          >
            <span style={{
              fontSize: '12px',
              fontFamily: 'var(--font-serif)',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}>
              {note.title || 'Untitled'}
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); closeTab(id) }}
              style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1, flexShrink: 0 }}
            >
              ×
            </span>
          </div>
        )
      })}

      {/* mindmap toggle */}
      <div style={{ flex: 1 }} />
      <div
        onClick={() => setView(view === 'mindmap' ? 'editor' : 'mindmap')}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          cursor: 'pointer',
          borderLeft: '1px solid var(--border)',
          background: view === 'mindmap' ? 'var(--bg-base)' : 'transparent',
          flexShrink: 0,
        }}
      >
        <span style={{
          fontSize: '12px',
          fontFamily: 'var(--font-serif)',
          color: view === 'mindmap' ? 'var(--text-primary)' : 'var(--text-muted)',
        }}>
          ⬡ Mind Map
        </span>
      </div>
    </div>
  )
}

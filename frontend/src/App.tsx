import { PanelControls } from './components/layout/PanelControls'
import { SplitView } from './components/layout/SplitView'

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        height: '38px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-rail)',
        flexShrink: 0,
        gap: '14px',
      }}>
        <span style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-ui)',
          letterSpacing: '0.01em',
        }}>
          ResearchOS
        </span>
        <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
        <PanelControls />
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        <SplitView />
      </div>
    </div>
  )
}

import { PanelControls } from './components/layout/PanelControls'
import { SplitView } from './components/layout/SplitView'

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        height: '40px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        flexShrink: 0,
        gap: '16px',
      }}>
        <span style={{
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-serif)',
          letterSpacing: '0.02em',
        }}>
          ResearchOS
        </span>
        <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
        <PanelControls />
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <SplitView />
      </div>
    </div>
  )
}

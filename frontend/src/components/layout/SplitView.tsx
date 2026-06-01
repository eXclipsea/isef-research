import { Group, Panel, Separator } from 'react-resizable-panels'
import { useLayoutStore } from '../../store/layoutStore'
import { NotesPanel } from '../notes/NotesPanel'
import { SearchPanel } from '../search/SearchPanel'
import { DocumentsPanel } from '../documents/DocumentsPanel'

export function SplitView() {
  const { activePanels } = useLayoutStore()

  const panels = [
    { id: 'notes', Component: NotesPanel },
    { id: 'search', Component: SearchPanel },
    { id: 'documents', Component: DocumentsPanel },
  ].filter((p) => activePanels.includes(p.id as any))

  return (
    <Group orientation="horizontal" style={{ height: '100%', display: 'flex' }}>
      {panels.map(({ id, Component }, i) => (
        <div key={id} style={{ display: 'contents' }}>
          {i > 0 && (
            <Separator
              style={{
                width: '4px',
                background: 'var(--border)',
                cursor: 'col-resize',
                flexShrink: 0,
              }}
            />
          )}
          <Panel
            defaultSize={Math.floor(100 / panels.length)}
            minSize={15}
            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <Component />
          </Panel>
        </div>
      ))}
    </Group>
  )
}

import { Fragment } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { useLayoutStore } from '../../store/layoutStore'
import { NotesPanel } from '../notes/NotesPanel'
import { SearchPanel } from '../search/SearchPanel'
import { DocumentsPanel } from '../documents/DocumentsPanel'

const ALL = [
  { id: 'notes', Component: NotesPanel },
  { id: 'search', Component: SearchPanel },
  { id: 'documents', Component: DocumentsPanel },
] as const

export function SplitView() {
  const { activePanels } = useLayoutStore()
  const panels = ALL.filter((p) => activePanels.includes(p.id as any))

  return (
    <Group
      orientation="horizontal"
      style={{ height: '100%', display: 'flex', width: '100%', flex: 1 }}
    >
      {panels.map(({ id, Component }, i) => (
        <Fragment key={id}>
          {i > 0 && (
            <Separator
              style={{
                width: '5px',
                background: 'var(--border)',
                cursor: 'col-resize',
                flexShrink: 0,
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--text-muted)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--border)')}
            />
          )}
          <Panel
            id={id}
            minSize={15}
            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <Component />
          </Panel>
        </Fragment>
      ))}
    </Group>
  )
}

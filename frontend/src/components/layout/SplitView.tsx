import { useLayoutStore } from '../../store/layoutStore'
import type { PanelId } from '../../types'
import { ResizableGroup } from './ResizableGroup'
import { PanelFrame } from './PanelFrame'
import { NotesPanel } from '../notes/NotesPanel'
import { SearchPanel } from '../search/SearchPanel'
import { DocumentsPanel } from '../documents/DocumentsPanel'

const COMPONENTS: Record<PanelId, React.FC> = {
  notes: NotesPanel,
  search: SearchPanel,
  documents: DocumentsPanel,
}

export function SplitView() {
  const { columns } = useLayoutStore()
  const signature = columns.map((c) => c.join('+')).join('|')

  const columnNodes = columns.map((col, colIdx) => {
    const panelNodes = col.map((id) => {
      const Component = COMPONENTS[id]
      return (
        <PanelFrame
          key={id}
          id={id}
          colIdx={colIdx}
          canStackLeft={colIdx > 0}
          canSplitOut={col.length > 1}
        >
          <Component />
        </PanelFrame>
      )
    })

    // single panel in column → no inner stack
    if (panelNodes.length === 1) return panelNodes[0]
    return (
      <ResizableGroup direction="vertical" signature={col.join('+')}>
        {panelNodes}
      </ResizableGroup>
    )
  })

  if (columnNodes.length === 1) {
    return <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>{columnNodes[0]}</div>
  }

  return (
    <ResizableGroup direction="horizontal" signature={signature}>
      {columnNodes}
    </ResizableGroup>
  )
}

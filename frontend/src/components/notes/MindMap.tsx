import { useNotesStore } from '../../store/notesStore'
import type { Note } from '../../types'

interface TreeNode {
  label: string
  kind: 'root' | 'heading' | 'text'
  level: number
  children: TreeNode[]
}

function parseNote(note: Note): TreeNode {
  const root: TreeNode = { label: note.title || 'Untitled', kind: 'root', level: 0, children: [] }
  const content = note.content || ''
  // stack of heading nodes; index roughly by heading level
  const stack: TreeNode[] = [root]
  const stackLevels: number[] = [0]

  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    const hMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (hMatch) {
      const level = hMatch[1].length
      const node: TreeNode = { label: hMatch[2], kind: 'heading', level, children: [] }
      // pop until we find a parent with a smaller heading level
      while (stackLevels.length > 1 && stackLevels[stackLevels.length - 1] >= level) {
        stack.pop()
        stackLevels.pop()
      }
      stack[stack.length - 1].children.push(node)
      stack.push(node)
      stackLevels.push(level)
    } else {
      // plain text — truncate long lines, strip markdown bullets
      const clean = line.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '')
      const label = clean.length > 80 ? clean.slice(0, 80) + '…' : clean
      const parent = stack[stack.length - 1]
      parent.children.push({ label, kind: 'text', level: parent.level + 1, children: [] })
    }
  }
  return root
}

function NodeView({ node, depth }: { node: TreeNode; depth: number }) {
  const isRoot = node.kind === 'root'
  const isHeading = node.kind === 'heading'

  const fontSize = isRoot ? '17px' : isHeading ? (node.level <= 1 ? '15px' : '14px') : '13px'
  const fontWeight = isRoot ? 700 : isHeading ? 700 : 400
  const color = isRoot ? 'var(--text-primary)' : isHeading ? 'var(--text-primary)' : 'var(--text-secondary)'
  const fontStyle = node.kind === 'text' ? 'italic' : 'normal'

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '8px',
        padding: '3px 0',
        position: 'relative',
      }}>
        {depth > 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: '12px', flexShrink: 0 }}>
            {node.kind === 'text' ? '·' : '–'}
          </span>
        )}
        <span style={{
          fontSize,
          fontWeight,
          color,
          fontStyle,
          fontFamily: 'var(--font-ui)',
          lineHeight: 1.4,
          borderBottom: isRoot ? '1px solid var(--border)' : 'none',
          paddingBottom: isRoot ? '4px' : 0,
        }}>
          {node.label}
        </span>
      </div>
      {node.children.length > 0 && (
        <div style={{
          borderLeft: depth >= 0 ? '1px solid var(--border-light)' : 'none',
          marginLeft: depth === 0 ? '6px' : '6px',
          paddingLeft: '6px',
        }}>
          {node.children.map((child, i) => (
            <NodeView key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function MindMap() {
  const { notes, openTabs } = useNotesStore()
  const openNotes = openTabs.map((id) => notes.find((n) => n.id === id)).filter(Boolean) as Note[]

  if (openNotes.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontStyle: 'italic', fontSize: '14px' }}>
        Open some notes to see the mind map
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px', background: 'var(--bg-base)' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>
        Mind Map — {openNotes.length} {openNotes.length === 1 ? 'tab' : 'tabs'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {openNotes.map((note) => (
          <NodeView key={note.id} node={parseNote(note)} depth={0} />
        ))}
      </div>
    </div>
  )
}

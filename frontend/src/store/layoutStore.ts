import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PanelId } from '../types'

const ORDER: PanelId[] = ['notes', 'search', 'documents']

// Layout is columns (left→right); each column stacks panels (top→bottom).
type Columns = PanelId[][]

interface LayoutState {
  columns: Columns
  togglePanel: (id: PanelId) => void
  stackLeft: (id: PanelId) => void   // merge into the column to the left (stack)
  splitOut: (id: PanelId) => void    // give the panel its own column
}

function locate(columns: Columns, id: PanelId): [number, number] | null {
  for (let c = 0; c < columns.length; c++) {
    const r = columns[c].indexOf(id)
    if (r !== -1) return [c, r]
  }
  return null
}

function prune(columns: Columns): Columns {
  return columns.filter((col) => col.length > 0)
}

function isActive(columns: Columns, id: PanelId): boolean {
  return columns.some((col) => col.includes(id))
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      columns: [['notes'], ['search'], ['documents']],

      togglePanel: (id) =>
        set((s) => {
          if (isActive(s.columns, id)) {
            const flat = s.columns.flat()
            if (flat.length === 1) return s // keep at least one open
            return { columns: prune(s.columns.map((col) => col.filter((p) => p !== id))) }
          }
          // add as a new column, kept in canonical left→right order
          const next = [...s.columns, [id]]
          next.sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]))
          return { columns: next }
        }),

      stackLeft: (id) =>
        set((s) => {
          const loc = locate(s.columns, id)
          if (!loc) return s
          const [c] = loc
          if (c === 0) return s // already leftmost column
          const cols = s.columns.map((col) => [...col])
          cols[c] = cols[c].filter((p) => p !== id)
          cols[c - 1].push(id)
          return { columns: prune(cols) }
        }),

      splitOut: (id) =>
        set((s) => {
          const loc = locate(s.columns, id)
          if (!loc) return s
          const [c] = loc
          const cols = s.columns.map((col) => [...col])
          if (cols[c].length === 1) return s // already alone in its column
          cols[c] = cols[c].filter((p) => p !== id)
          cols.splice(c + 1, 0, [id])
          return { columns: prune(cols) }
        }),
    }),
    { name: 'researchos-layout-v2' }
  )
)

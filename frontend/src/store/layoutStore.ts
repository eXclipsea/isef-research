import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PanelId } from '../types'

interface LayoutState {
  activePanels: PanelId[]
  togglePanel: (id: PanelId) => void
  setActivePanels: (panels: PanelId[]) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      activePanels: ['notes', 'search', 'documents'],
      togglePanel: (id) =>
        set((s) => {
          const has = s.activePanels.includes(id)
          if (has && s.activePanels.length === 1) return s
          const next = has
            ? s.activePanels.filter((p) => p !== id)
            : [...s.activePanels, id]
          const order: PanelId[] = ['notes', 'search', 'documents']
          return { activePanels: order.filter((p) => next.includes(p)) }
        }),
      setActivePanels: (panels) => set({ activePanels: panels }),
    }),
    { name: 'researchos-layout' }
  )
)

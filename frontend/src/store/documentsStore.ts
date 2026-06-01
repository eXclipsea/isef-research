import { create } from 'zustand'
import type { Document } from '../types'
import { listDocuments } from '../api/documents'

interface DocumentsState {
  docs: Document[]
  loading: boolean
  reload: () => Promise<void>
  addDocs: (docs: Document[]) => void
  removeDoc: (id: string) => void
}

export const useDocumentsStore = create<DocumentsState>((set) => ({
  docs: [],
  loading: false,
  reload: async () => {
    set({ loading: true })
    try {
      set({ docs: await listDocuments() })
    } finally {
      set({ loading: false })
    }
  },
  addDocs: (docs) =>
    set((s) => {
      const ids = new Set(s.docs.map((d) => d.id))
      return { docs: [...docs.filter((d) => !ids.has(d.id)), ...s.docs] }
    }),
  removeDoc: (id) => set((s) => ({ docs: s.docs.filter((d) => d.id !== id) })),
}))

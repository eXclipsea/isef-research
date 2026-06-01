import { create } from 'zustand'
import type { Note } from '../types'

interface NotesState {
  notes: Note[]
  selectedId: string | null
  setNotes: (notes: Note[]) => void
  selectNote: (id: string | null) => void
  upsertNote: (note: Note) => void
  removeNote: (id: string) => void
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  selectedId: null,
  setNotes: (notes) => set({ notes }),
  selectNote: (id) => set({ selectedId: id }),
  upsertNote: (note) =>
    set((s) => {
      const exists = s.notes.find((n) => n.id === note.id)
      return {
        notes: exists
          ? s.notes.map((n) => (n.id === note.id ? note : n))
          : [note, ...s.notes],
      }
    }),
  removeNote: (id) =>
    set((s) => ({
      notes: s.notes.filter((n) => n.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),
}))

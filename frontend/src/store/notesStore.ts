import { create } from 'zustand'
import type { Note } from '../types'

type NotesView = 'editor' | 'mindmap'

interface NotesState {
  notes: Note[]
  openTabs: string[]          // note ids open as tabs
  activeTabId: string | null  // focused tab
  view: NotesView
  stats: { words: number; chars: number }
  setStats: (words: number, chars: number) => void
  setNotes: (notes: Note[]) => void
  openTab: (id: string) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  setView: (v: NotesView) => void
  upsertNote: (note: Note) => void
  removeNote: (id: string) => void
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  openTabs: [],
  activeTabId: null,
  view: 'editor',
  stats: { words: 0, chars: 0 },
  setStats: (words, chars) => set({ stats: { words, chars } }),
  setNotes: (notes) => set({ notes }),
  setView: (view) => set({ view }),
  openTab: (id) =>
    set((s) => ({
      openTabs: s.openTabs.includes(id) ? s.openTabs : [...s.openTabs, id],
      activeTabId: id,
      view: 'editor',
    })),
  closeTab: (id) =>
    set((s) => {
      const idx = s.openTabs.indexOf(id)
      const next = s.openTabs.filter((t) => t !== id)
      let active = s.activeTabId
      if (s.activeTabId === id) {
        active = next[Math.min(idx, next.length - 1)] ?? null
      }
      return { openTabs: next, activeTabId: active }
    }),
  setActiveTab: (id) => set({ activeTabId: id, view: 'editor' }),
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
    set((s) => {
      const next = s.openTabs.filter((t) => t !== id)
      return {
        notes: s.notes.filter((n) => n.id !== id),
        openTabs: next,
        activeTabId: s.activeTabId === id ? (next[next.length - 1] ?? null) : s.activeTabId,
      }
    }),
}))

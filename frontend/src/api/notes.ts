import type { Note } from '../types'

const BASE = '/api/notes'

export async function listNotes(tag?: string): Promise<Note[]> {
  const url = tag ? `${BASE}?tag=${encodeURIComponent(tag)}` : BASE
  const r = await fetch(url)
  return r.json()
}

export async function getNote(id: string): Promise<Note> {
  const r = await fetch(`${BASE}/${id}`)
  return r.json()
}

export async function createNote(data: { title: string; content: string; tags: string[] }): Promise<Note> {
  const r = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function updateNote(id: string, data: Partial<{ title: string; content: string; tags: string[] }>): Promise<Note> {
  const r = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return r.json()
}

export async function deleteNote(id: string): Promise<void> {
  await fetch(`${BASE}/${id}`, { method: 'DELETE' })
}

export async function searchNotes(q: string): Promise<Note[]> {
  const r = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}`)
  return r.json()
}

export async function getNoteBacklinks(id: string): Promise<Note[]> {
  const r = await fetch(`${BASE}/${id}/backlinks`)
  return r.json()
}

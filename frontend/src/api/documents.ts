import type { Document, RAGAnswer } from '../types'

const BASE = '/api/documents'

export async function listDocuments(): Promise<Document[]> {
  const r = await fetch(BASE)
  return r.json()
}

export async function uploadDocument(file: File): Promise<Document> {
  const form = new FormData()
  form.append('file', file)
  const r = await fetch(`${BASE}/upload`, { method: 'POST', body: form })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function deleteDocument(id: string): Promise<void> {
  await fetch(`${BASE}/${id}`, { method: 'DELETE' })
}

export async function queryDocument(id: string, question: string): Promise<RAGAnswer> {
  const r = await fetch(`${BASE}/${id}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  return r.json()
}

export async function getKeyPoints(id: string): Promise<string[]> {
  const r = await fetch(`${BASE}/${id}/keypoints`)
  const data = await r.json()
  return data.keypoints
}

export async function getCitation(id: string, style = 'apa'): Promise<string> {
  const r = await fetch(`${BASE}/${id}/citation?style=${style}`)
  const data = await r.json()
  return data.citation
}

export function getDocumentFileUrl(id: string): string {
  return `/api/documents/${id}/file`
}

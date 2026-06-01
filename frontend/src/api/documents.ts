import type { Document, RAGAnswer } from '../types'
import { jsonOrThrow } from './http'

const BASE = '/api/documents'

export async function listDocuments(): Promise<Document[]> {
  return jsonOrThrow(await fetch(BASE))
}

export async function uploadDocument(file: File): Promise<Document> {
  const form = new FormData()
  form.append('file', file)
  return jsonOrThrow(await fetch(`${BASE}/upload`, { method: 'POST', body: form }))
}

export async function deleteDocument(id: string): Promise<void> {
  await fetch(`${BASE}/${id}`, { method: 'DELETE' })
}

export async function queryDocument(id: string, question: string): Promise<RAGAnswer> {
  return jsonOrThrow(await fetch(`${BASE}/${id}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  }))
}

export async function getKeyPoints(id: string): Promise<string[]> {
  const data = await jsonOrThrow<{ keypoints: string[] }>(await fetch(`${BASE}/${id}/keypoints`))
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

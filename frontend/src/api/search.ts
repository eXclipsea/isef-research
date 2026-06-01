import type { SearchResponse, PaperResult } from '../types'

const BASE = '/api/search'

export async function doSearch(query: string, mode: 'web' | 'papers' | 'all' = 'all'): Promise<SearchResponse> {
  const r = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, mode }),
  })
  return r.json()
}

export async function searchPapers(q: string, limit = 5): Promise<PaperResult[]> {
  const r = await fetch(`${BASE}/papers?q=${encodeURIComponent(q)}&limit=${limit}`)
  const data = await r.json()
  return data.results
}

export async function getCitationFromDoi(doi: string, style = 'apa'): Promise<string> {
  const r = await fetch(`${BASE}/citation?doi=${encodeURIComponent(doi)}&style=${style}`)
  const data = await r.json()
  return data.citation
}

export async function getPdfFromDoi(doi: string): Promise<string | null> {
  const r = await fetch(`${BASE}/pdf?doi=${encodeURIComponent(doi)}`)
  const data = await r.json()
  return data.pdf_url
}

export async function fetchUrl(url: string): Promise<string> {
  const r = await fetch(`${BASE}/fetch?url=${encodeURIComponent(url)}`)
  const data = await r.json()
  return data.text
}

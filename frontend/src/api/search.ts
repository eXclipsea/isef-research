import type { SearchResponse, PaperResult, TopicsResult, ResearchPlan } from '../types'
import { jsonOrThrow } from './http'

const BASE = '/api/search'

export async function researchAssistant(project: string): Promise<ResearchPlan> {
  return jsonOrThrow(await fetch(`${BASE}/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project }),
  }))
}

export async function generateTopics(
  query: string,
  sources: { title: string; url: string; snippet?: string; abstract?: string }[]
): Promise<TopicsResult> {
  return jsonOrThrow(await fetch(`${BASE}/topics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, sources }),
  }))
}

export async function doSearch(query: string, mode: 'web' | 'papers' | 'all' = 'all'): Promise<SearchResponse> {
  return jsonOrThrow(await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, mode }),
  }))
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

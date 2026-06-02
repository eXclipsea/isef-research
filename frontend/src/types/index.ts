export interface Note {
  id: string
  title: string
  filename: string
  created_at: string
  updated_at: string
  tags: string[]
  folder?: string | null
  content?: string
}

export interface Document {
  id: string
  filename: string
  chunk_count: number
  created_at: string
  doi: string | null
  kind?: 'pdf' | 'paper'
  title?: string
  authors?: string[]
  year?: number | null
  abstract?: string
  url?: string
  source?: string
  has_pdf?: boolean
  indexed?: boolean
}

export interface Citation {
  tag: string
  filename: string
  page: number
  chunk_index: number
}

export interface RAGAnswer {
  answer: string
  citations: Citation[]
}

export interface PaperResult {
  title: string
  authors: string[]
  year: number | null
  abstract: string
  url: string
  pdf_url: string | null
  doi: string | null
  source: string
}

export interface WebResult {
  title: string
  url: string
  snippet: string
  source: string
}

export interface SearchResponse {
  summary: string
  web_results: WebResult[]
  paper_results: PaperResult[]
  warnings?: string[]
}

export interface TopicsResult {
  topics: string[]
  overview: string
}

export interface DocHit {
  doc_id: string
  title: string
  kind: 'pdf' | 'paper'
  page: number | null
  chunk_index: number | null
  snippet: string
  distance: number
}

export interface ResearchPlan {
  summary: string
  questions: string[]
  searches: string[]
  subtopics: string[]
  outline: string[]
}

export type PanelId = 'notes' | 'search' | 'documents'

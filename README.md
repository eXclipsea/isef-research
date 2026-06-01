# ResearchOS

A fully local AI research tool for ISEF. Replaces Perplexity, Anara, and Obsidian.

**Three modules:** Notes · Search · Research (RAG)

---

## Quick Start

```bash
./start.sh
```

Opens at **http://localhost:8000** automatically.

That's it. One command starts everything.

---

## First-Time Setup

### 1. Install Python dependencies

```bash
cd backend
python3 -m venv venv
venv/bin/pip install -r requirements.txt
```

### 2. Install SearXNG (search engine)

```bash
cd searxng
python3 -m venv venv
venv/bin/pip install setuptools msgspec
venv/bin/pip install -r requirements.txt
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

### 4. Pull Ollama models

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

Ollama must be running (`ollama serve`) before starting the app.

---

## What It Does

### Notes
- Obsidian-style markdown editor
- `[[wikilink]]` backlinks tracked automatically
- Tag system, full-text search
- Files stored as `.md` in `backend/data/notes/`

### Search
- SearXNG aggregates Google, Bing, DuckDuckGo, Google Scholar, arXiv, PubMed simultaneously
- Ollama synthesises results with inline `[1][2]` citations
- Direct academic APIs: Semantic Scholar, arXiv, PubMed, CrossRef, Unpaywall
- "Save to Note" from any search result
- APA/MLA/Chicago citation generator from DOI

### Research (Document Brain)
- Upload any PDF — parsed, chunked, embedded locally with `nomic-embed-text`
- Chat with the document using RAG — answers cite specific pages and chunks
- Key points extraction via `llama3.2`
- Citation generator (APA/MLA/Chicago) via CrossRef

### Layout
- Three resizable panels — toggle any combination from the top bar
- Drag the dividers to resize

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Python 3.11+ · FastAPI · Uvicorn |
| LLM | Ollama · llama3.2 · nomic-embed-text |
| Vector DB | ChromaDB (local, no server) |
| PDF | PyMuPDF (fitz) |
| Notes | .md files + SQLite |
| Search | SearXNG (self-hosted) |
| Frontend | React · Vite · TypeScript |

Everything runs offline except SearXNG's upstream searches (Google, Bing, etc.).

---

## Environment Variables

Copy `.env.example` to `.env` in the `backend/` folder:

```
EMAIL=your@email.com    # used by Unpaywall API (required for free PDF links)
```

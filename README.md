# ResearchOS

A fully local AI research tool for ISEF. Replaces Perplexity, Anara, and Obsidian.

**Three modules:** Notes · Search · Research (RAG)

---

## Quick Start (first time)

```bash
git clone https://github.com/eXclipsea/isef-research.git
cd isef-research
./setup.sh        # installs everything, one time
./start.sh        # launches the app
```

After setup, **double-click ResearchOS.app** (built for your machine by
`setup.sh`) or run `./start.sh`. Opens at **http://localhost:8000**.

---

## Sharing it with friends

**There are no API keys to hand out — the app is fully local and free.**
Search uses a local engine (SearXNG) plus free scholarly APIs
(Semantic Scholar, arXiv, PubMed, CrossRef) that need no keys.

To let a friend run their own copy, they just need a Mac with a few free
tools installed, then one command:

1. **Install the prerequisites** (one-time, all free):
   - [Ollama](https://ollama.com/download) — the local AI
   - [Node.js](https://nodejs.org) and [Python 3.11+](https://python.org)
     (or `brew install node python3`)
2. **Clone and set up:**
   ```bash
   git clone https://github.com/eXclipsea/isef-research.git
   cd isef-research
   ./setup.sh
   ```
   `setup.sh` checks the prerequisites, installs all dependencies, downloads
   the AI models, sets up the local search engine, and builds their own
   `ResearchOS.app`.
3. **Run it:** `./start.sh` (or double-click ResearchOS.app).

### Optional keys (not required)
Everything works without keys. If a friend *wants* extras, they create their
own `backend/.env` (copy from `backend/.env.example`):
- `EMAIL` — used by the free Unpaywall API to find open-access PDFs.
- `BRAVE_API_KEY` — a free [Brave Search](https://brave.com/search/api) key,
  only used as a fallback if SearXNG isn't running. Each person gets their
  own from Brave's site.

---

## Layout

Use the **Layout** menu (top-right) to arrange the three panels —
three columns, two columns with one column stacked (e.g. Search over
Research), and so on. You can also **drag a panel's title onto another
panel to stack them**, and drag the dividers to resize. Each panel header
has stack / split / close controls.

## Notes

- Markdown live-preview editor (Obsidian-style), word/character count.
- Organise notes into **folders** — drag a note onto a folder, or use the
  note's "⋯" menu to move / delete it.
- "Save to note" anywhere lets you create a **new note** or **append to an
  existing one**.

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

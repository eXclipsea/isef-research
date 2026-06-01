# ResearchOS — Local AI Research App

## What this is
A fully local, free research tool replacing Perplexity + Anara + Obsidian.
Three modules: Search, Document Brain, Notes.

## Tech Stack
- Backend: Python 3.13 + FastAPI
- LLM: Ollama (local). Use `llama3.2` for chat, `nomic-embed-text` for embeddings
- Vector DB: ChromaDB (local, no server needed)
- PDF parsing: PyMuPDF (fitz)
- Notes: .md files on disk + SQLite index
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Web search: Brave Search API (free tier) — BRAVE_API_KEY env var
- Paper search: Semantic Scholar, arXiv, PubMed, CrossRef, Unpaywall (all free)

## Project Structure
```
ISEF-RESEARCH/
backend/
  modules/
    documents/   # RAG pipeline (Anara replacement)
    search/      # Web + paper search (Perplexity replacement)
    notes/       # Note CRUD (Obsidian replacement)
  main.py
  requirements.txt
  data/
    uploads/     # User-uploaded PDFs
    notes/       # .md note files
    vectordb/    # ChromaDB storage
frontend/        # React app
CLAUDE.md
```

## Rules
- Always run `pip install` deps into backend/venv
- Every API route gets a corresponding React component
- Citations must carry: source filename, page number, chunk index
- Never use cloud APIs — everything must work offline except Brave Search
- After each phase, run the app and confirm it works before moving on

## Scholarly Paper Sources
- Semantic Scholar: 200M+ papers, great for STEM, no key needed
- arXiv: free full PDFs for CS/physics/bio/math preprints
- PubMed/NCBI: biology, chemistry, medicine
- CrossRef: DOI → APA/MLA/Chicago citation metadata
- Unpaywall: DOI → legal free PDF URL
- OpenAlex: broadest coverage, no key needed

## Running the App
```bash
# Backend
cd backend && venv/bin/uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```

## Environment Variables
Copy backend/.env.example to backend/.env and fill in:
- BRAVE_API_KEY — from https://brave.com/search/api/
- EMAIL — your email (required by some APIs like Unpaywall)

## Current Phase
Phase: Complete — all 3 modules built.

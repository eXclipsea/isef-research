"""Turn a search result (paper or web source) into a Research document.

If a PDF is available it is downloaded and parsed; otherwise the abstract /
snippet text is indexed so the user can still chat, cite and extract topics.
"""
import uuid
from datetime import datetime, timezone
from pathlib import Path

import httpx

from .parser import parse_pdf, chunk_pages
from .rag import ingest_chunks, delete_collection
from ..llm import OllamaUnavailable

UPLOADS_DIR = Path(__file__).parent.parent.parent / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


async def _download_pdf(url: str, dest: Path) -> bool:
    try:
        async with httpx.AsyncClient(timeout=25, follow_redirects=True) as client:
            r = await client.get(url, headers={"User-Agent": "ResearchOS/1.0"})
            ctype = r.headers.get("content-type", "")
            if r.status_code == 200 and ("pdf" in ctype.lower() or url.lower().endswith(".pdf")):
                dest.write_bytes(r.content)
                return True
    except Exception:
        pass
    return False


async def ingest_paper(paper: dict) -> dict:
    """Create a Research document from a paper/source dict.

    paper keys: title, authors[], year, abstract, url, pdf_url, doi, source, snippet
    """
    doc_id = str(uuid.uuid4())
    title = paper.get("title") or "Untitled"
    pdf_dest = UPLOADS_DIR / f"{doc_id}.pdf"

    has_pdf = False
    pdf_url = paper.get("pdf_url")
    if pdf_url:
        has_pdf = await _download_pdf(pdf_url, pdf_dest)

    # build chunks from the PDF if we got one, else from abstract/snippet text
    if has_pdf:
        chunks = parse_pdf(str(pdf_dest))
        if not chunks:  # scanned/empty PDF — fall back to abstract
            has_pdf = False
    if not has_pdf:
        body = paper.get("abstract") or paper.get("snippet") or ""
        text = f"{title}\n\n{body}".strip()
        chunks = chunk_pages([{"page": 1, "text": text}]) if text else []

    indexed = False
    if chunks:
        try:
            ingest_chunks(doc_id, chunks)
            indexed = True
        except OllamaUnavailable:
            # keep the document/metadata; it just won't be searchable until Ollama is up
            delete_collection(doc_id)
            indexed = False

    meta = {
        "id": doc_id,
        "kind": "paper",
        "filename": title,
        "title": title,
        "authors": paper.get("authors") or [],
        "year": paper.get("year"),
        "abstract": paper.get("abstract") or paper.get("snippet") or "",
        "url": paper.get("url") or "",
        "doi": paper.get("doi"),
        "source": paper.get("source") or "search",
        "has_pdf": has_pdf,
        "indexed": indexed,
        "chunk_count": len(chunks),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    return meta

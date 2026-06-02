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
from ..search.papers import get_unpaywall_pdf

UPLOADS_DIR = Path(__file__).parent.parent.parent / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


async def _download_pdf(url: str, dest: Path) -> bool:
    """Download `url` if it's really a PDF (detected by the %PDF magic bytes,
    not just the content-type header which many servers get wrong)."""
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            r = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (ResearchOS; academic use)",
                "Accept": "application/pdf,*/*",
            })
            if r.status_code != 200:
                return False
            content = r.content
            ctype = r.headers.get("content-type", "").lower()
            looks_pdf = (
                content[:5] == b"%PDF-"            # magic bytes — most reliable
                or "pdf" in ctype
                or url.lower().split("?")[0].endswith(".pdf")
            )
            # guard against tiny error pages masquerading as PDFs
            if looks_pdf and content[:5] == b"%PDF-":
                dest.write_bytes(content)
                return True
            if looks_pdf and len(content) > 1000:
                dest.write_bytes(content)
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
    # 1) try the direct open-access PDF link from the search result
    pdf_url = paper.get("pdf_url")
    if pdf_url:
        has_pdf = await _download_pdf(pdf_url, pdf_dest)

    # 2) fall back to Unpaywall via the DOI (finds a free legal PDF if one exists)
    if not has_pdf and paper.get("doi"):
        unpaywall_url = await get_unpaywall_pdf(paper["doi"])
        if unpaywall_url:
            has_pdf = await _download_pdf(unpaywall_url, pdf_dest)

    # 3) last resort: if the source page itself is a PDF link
    if not has_pdf and (paper.get("url") or "").lower().split("?")[0].endswith(".pdf"):
        has_pdf = await _download_pdf(paper["url"], pdf_dest)

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

import json
import re
import uuid
from pathlib import Path
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .parser import parse_pdf
from .rag import ingest_chunks, query_document, delete_collection, extract_key_points
from .paper_ingest import ingest_paper
from ..llm import OllamaUnavailable
from ..search.synthesizer import extract_topics

router = APIRouter()

UPLOADS_DIR = Path(__file__).parent.parent.parent / "data" / "uploads"
META_DIR = Path(__file__).parent.parent.parent / "data" / "doc_meta"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
META_DIR.mkdir(parents=True, exist_ok=True)


def save_meta(doc_id: str, meta: dict):
    (META_DIR / f"{doc_id}.json").write_text(json.dumps(meta), encoding="utf-8")


def load_meta(doc_id: str) -> dict:
    path = META_DIR / f"{doc_id}.json"
    if not path.exists():
        raise HTTPException(404, "Document not found")
    return json.loads(path.read_text(encoding="utf-8"))


def list_all_meta() -> list[dict]:
    metas = []
    for f in META_DIR.glob("*.json"):
        try:
            metas.append(json.loads(f.read_text(encoding="utf-8")))
        except Exception:
            pass
    metas.sort(key=lambda m: m.get("created_at", ""), reverse=True)
    return metas


class QueryBody(BaseModel):
    question: str


class PaperRef(BaseModel):
    title: str = ""
    authors: list[str] = []
    year: Optional[int] = None
    abstract: str = ""
    snippet: str = ""
    url: str = ""
    pdf_url: Optional[str] = None
    doi: Optional[str] = None
    source: str = "search"


class FromPapersBody(BaseModel):
    papers: list[PaperRef]


class TopicsBody(BaseModel):
    doc_ids: list[str]
    project: str = ""


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")

    doc_id = str(uuid.uuid4())
    filename = file.filename
    dest = UPLOADS_DIR / f"{doc_id}.pdf"

    content = await file.read()
    dest.write_bytes(content)

    chunks = parse_pdf(str(dest))
    try:
        ingest_chunks(doc_id, chunks)
    except OllamaUnavailable as e:
        dest.unlink(missing_ok=True)
        delete_collection(doc_id)
        raise HTTPException(503, str(e))

    from datetime import datetime, timezone
    meta = {
        "id": doc_id,
        "filename": filename,
        "chunk_count": len(chunks),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "doi": None,
    }
    save_meta(doc_id, meta)
    return meta


@router.post("/from-papers")
async def add_papers(body: FromPapersBody):
    """Add selected search results to Research documents."""
    added = []
    for p in body.papers:
        meta = await ingest_paper(p.model_dump())
        save_meta(meta["id"], meta)
        added.append(meta)
    return {"added": added}


@router.post("/topics")
def docs_topics(body: TopicsBody):
    """Generate key topics across selected research documents."""
    sources = []
    for doc_id in body.doc_ids:
        try:
            meta = load_meta(doc_id)
        except HTTPException:
            continue
        text = meta.get("abstract", "")
        pdf_path = UPLOADS_DIR / f"{doc_id}.pdf"
        if pdf_path.exists():
            chunks = parse_pdf(str(pdf_path))[:8]
            if chunks:
                text = "\n\n".join(c["text"] for c in chunks)
        sources.append({"title": meta.get("title") or meta.get("filename"), "text": text})

    if not sources:
        return {"topics": [], "overview": "No documents selected."}
    return extract_topics(body.project or "this research", sources)


@router.get("")
def list_documents():
    return list_all_meta()


@router.delete("/{doc_id}")
def delete_document(doc_id: str):
    meta = load_meta(doc_id)
    pdf_path = UPLOADS_DIR / f"{doc_id}.pdf"
    if pdf_path.exists():
        pdf_path.unlink()
    delete_collection(doc_id)
    (META_DIR / f"{doc_id}.json").unlink(missing_ok=True)
    return {"ok": True}


@router.post("/{doc_id}/query")
def query_doc(doc_id: str, body: QueryBody):
    meta = load_meta(doc_id)
    try:
        return query_document(doc_id, meta["filename"], body.question)
    except OllamaUnavailable as e:
        raise HTTPException(503, str(e))


@router.get("/{doc_id}/keypoints")
def keypoints(doc_id: str):
    meta = load_meta(doc_id)
    pdf_path = UPLOADS_DIR / f"{doc_id}.pdf"
    if pdf_path.exists():
        chunks = parse_pdf(str(pdf_path))
    else:
        # paper added without a PDF — use its abstract
        from .parser import chunk_pages
        abstract = meta.get("abstract", "")
        if not abstract:
            raise HTTPException(404, "No text available for this document")
        chunks = chunk_pages([{"page": 1, "text": abstract}])
    try:
        points = extract_key_points(meta["filename"], chunks)
    except OllamaUnavailable as e:
        raise HTTPException(503, str(e))
    return {"keypoints": points}


@router.get("/{doc_id}/citation")
async def get_citation(doc_id: str, style: str = "apa"):
    meta = load_meta(doc_id)
    doi = meta.get("doi")

    if doi:
        async with httpx.AsyncClient(timeout=10) as client:
            accept = {
                "apa": "text/x-bibliography; style=apa",
                "mla": "text/x-bibliography; style=modern-language-association",
                "chicago": "text/x-bibliography; style=chicago-author-date",
            }.get(style, "text/x-bibliography; style=apa")
            try:
                r = await client.get(
                    f"https://doi.org/{doi}",
                    headers={"Accept": accept},
                    follow_redirects=True,
                )
                if r.status_code == 200:
                    return {"citation": r.text.strip(), "doi": doi, "style": style}
            except Exception:
                pass

    # fallback: construct from filename
    name = re.sub(r'\.pdf$', '', meta["filename"], flags=re.I)
    citation = f"{name}. (n.d.). [PDF document]. Retrieved from local upload."
    return {"citation": citation, "doi": doi, "style": style}


@router.get("/{doc_id}/file")
def serve_file(doc_id: str):
    meta = load_meta(doc_id)
    pdf_path = UPLOADS_DIR / f"{doc_id}.pdf"
    if not pdf_path.exists():
        raise HTTPException(404, "PDF not found")
    return FileResponse(str(pdf_path), media_type="application/pdf", filename=meta["filename"])

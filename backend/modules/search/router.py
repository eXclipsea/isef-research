import asyncio
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from .searxng import searxng_search, searxng_papers, searxng_status
from .fetcher import fetch_page_text
from .papers import search_all_papers, get_crossref_citation, get_unpaywall_pdf
from .synthesizer import synthesize, extract_topics, research_plan
from ..llm import ollama_status

router = APIRouter()


def _dedup(*lists) -> list[dict]:
    seen, out = set(), []
    for lst in lists:
        for p in lst:
            key = (p.get("title") or "").lower()[:60]
            if key and key not in seen:
                seen.add(key)
                out.append(p)
    return out


class SearchBody(BaseModel):
    query: str
    mode: Literal["web", "papers", "all"] = "all"
    num_results: int = 30


class SourceRef(BaseModel):
    title: str = ""
    url: str = ""
    snippet: str = ""
    abstract: str = ""


class TopicsBody(BaseModel):
    query: str
    sources: list[SourceRef]


class AssistantBody(BaseModel):
    project: str


@router.post("/assistant")
async def assistant(body: AssistantBody):
    """Help a student start their research project."""
    return research_plan(body.project)


@router.get("/health")
async def search_health():
    """Quick status of the moving parts so the UI can warn clearly."""
    sx = await searxng_status()
    return {"ollama": ollama_status(), "searxng": sx}


@router.post("")
async def search(body: SearchBody):
    web_results, paper_results = [], []
    warnings: list[str] = []

    if body.mode in ("web", "all"):
        try:
            web_results = await searxng_search(body.query, count=body.num_results)
            if not web_results:
                warnings.append(
                    "No web results — SearXNG may be offline (start it via ./start.sh)."
                )
        except Exception as e:
            warnings.append(f"Web search failed: {e}")

    if body.mode in ("papers", "all"):
        try:
            per_source = max(10, body.num_results // 2)
            searxng_sci, api_papers = await asyncio.gather(
                searxng_papers(body.query, count=body.num_results),
                search_all_papers(body.query, limit_each=per_source),
                return_exceptions=True,
            )
            sci = searxng_sci if isinstance(searxng_sci, list) else []
            api = api_papers if isinstance(api_papers, list) else []
            paper_results = _dedup(sci, api)
            if not paper_results:
                warnings.append("No papers found — try broader keywords.")
        except Exception as e:
            warnings.append(f"Paper search failed: {e}")

    # synthesis numbering matches the UI (papers listed first, then web);
    # only the top sources go to the LLM so its context stays manageable
    all_sources = paper_results + web_results
    summary = synthesize(body.query, all_sources[:12])

    return {
        "summary": summary,
        "web_results": web_results,
        "paper_results": paper_results,
        "warnings": warnings,
    }


@router.get("/fetch")
async def fetch_url(url: str):
    text = await fetch_page_text(url)
    return {"url": url, "text": text}


@router.post("/topics")
async def generate_topics(body: TopicsBody):
    # fetch full page text for each selected source (papers may have no url → use abstract)
    async def enrich(src: SourceRef) -> dict:
        text = ""
        if src.url:
            try:
                text = await fetch_page_text(src.url)
            except Exception:
                text = ""
        return {
            "title": src.title,
            "url": src.url,
            "text": text,
            "snippet": src.snippet,
            "abstract": src.abstract,
        }

    enriched = await asyncio.gather(*[enrich(s) for s in body.sources])
    return extract_topics(body.query, enriched)


@router.get("/papers")
async def papers_search(q: str, limit: int = 5):
    searxng_sci, api_papers = await asyncio.gather(
        searxng_papers(q, count=limit),
        search_all_papers(q, limit_each=limit),
        return_exceptions=True,
    )
    sci = searxng_sci if isinstance(searxng_sci, list) else []
    api = api_papers if isinstance(api_papers, list) else []
    return {"results": _dedup(sci, api)}


@router.get("/citation")
async def citation_from_doi(doi: str, style: str = "apa"):
    citation = await get_crossref_citation(doi, style)
    return {"doi": doi, "citation": citation, "style": style}


@router.get("/pdf")
async def pdf_from_doi(doi: str):
    url = await get_unpaywall_pdf(doi)
    return {"doi": doi, "pdf_url": url}

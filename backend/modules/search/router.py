import asyncio
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from .searxng import searxng_search, searxng_papers
from .fetcher import fetch_page_text
from .papers import search_all_papers, get_crossref_citation, get_unpaywall_pdf
from .synthesizer import synthesize

router = APIRouter()


class SearchBody(BaseModel):
    query: str
    mode: Literal["web", "papers", "all"] = "all"
    num_results: int = 8


@router.post("")
async def search(body: SearchBody):
    web_results, paper_results = [], []

    if body.mode in ("web", "all"):
        web_results = await searxng_search(body.query, count=body.num_results)

    if body.mode in ("papers", "all"):
        # combine SearXNG science results + direct academic APIs
        searxng_sci, api_papers = await asyncio.gather(
            searxng_papers(body.query, count=5),
            search_all_papers(body.query, limit_each=3),
        )
        # merge, dedup by title
        seen = set()
        for p in searxng_sci:
            key = p["title"].lower()[:60]
            if key not in seen:
                seen.add(key)
                paper_results.append(p)
        for p in api_papers:
            key = p["title"].lower()[:60]
            if key not in seen:
                seen.add(key)
                paper_results.append(p)

    all_sources = web_results + paper_results
    summary = synthesize(body.query, all_sources[:10])

    return {
        "summary": summary,
        "web_results": web_results,
        "paper_results": paper_results,
    }


@router.get("/fetch")
async def fetch_url(url: str):
    text = await fetch_page_text(url)
    return {"url": url, "text": text}


@router.get("/papers")
async def papers_search(q: str, limit: int = 5):
    searxng_sci, api_papers = await asyncio.gather(
        searxng_papers(q, count=limit),
        search_all_papers(q, limit_each=limit),
    )
    seen, results = set(), []
    for p in searxng_sci + api_papers:
        key = p["title"].lower()[:60]
        if key not in seen:
            seen.add(key)
            results.append(p)
    return {"results": results}


@router.get("/citation")
async def citation_from_doi(doi: str, style: str = "apa"):
    citation = await get_crossref_citation(doi, style)
    return {"doi": doi, "citation": citation, "style": style}


@router.get("/pdf")
async def pdf_from_doi(doi: str):
    url = await get_unpaywall_pdf(doi)
    return {"doi": doi, "pdf_url": url}

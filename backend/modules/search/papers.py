import asyncio
import os
import urllib.parse
import xml.etree.ElementTree as ET

import httpx

EMAIL = os.getenv("EMAIL", "research@example.com")


async def search_semantic_scholar(query: str, limit: int = 15) -> list[dict]:
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    params = {
        "query": query,
        "limit": limit,
        "fields": "title,authors,year,abstract,externalIds,openAccessPdf,url",
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            data = r.json()
    except Exception:
        return []

    results = []
    for p in data.get("data", []):
        authors = [a.get("name", "") for a in p.get("authors", [])]
        doi = (p.get("externalIds") or {}).get("DOI")
        pdf_url = (p.get("openAccessPdf") or {}).get("url")
        results.append({
            "title": p.get("title", ""),
            "authors": authors,
            "year": p.get("year"),
            "abstract": p.get("abstract", ""),
            "url": p.get("url", ""),
            "pdf_url": pdf_url,
            "doi": doi,
            "source": "Semantic Scholar",
        })
    return results


async def search_arxiv(query: str, limit: int = 15) -> list[dict]:
    url = "http://export.arxiv.org/api/query"
    params = {
        "search_query": f"all:{query}",
        "max_results": limit,
        "sortBy": "relevance",
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            text = r.text
    except Exception:
        return []

    ns = {"atom": "http://www.w3.org/2005/Atom"}
    root = ET.fromstring(text)
    results = []
    for entry in root.findall("atom:entry", ns):
        title = entry.findtext("atom:title", "", ns).strip().replace("\n", " ")
        abstract = entry.findtext("atom:summary", "", ns).strip()
        link = ""
        pdf_url = ""
        for l in entry.findall("atom:link", ns):
            href = l.get("href", "")
            if l.get("type") == "application/pdf":
                pdf_url = href
            elif l.get("rel") == "alternate":
                link = href
        authors = [a.findtext("atom:name", "", ns) for a in entry.findall("atom:author", ns)]
        published = entry.findtext("atom:published", "", ns)
        year = int(published[:4]) if published else None
        results.append({
            "title": title,
            "authors": authors,
            "year": year,
            "abstract": abstract,
            "url": link,
            "pdf_url": pdf_url,
            "doi": None,
            "source": "arXiv",
        })
    return results


async def search_pubmed(query: str, limit: int = 15) -> list[dict]:
    base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    params_search = {
        "db": "pubmed",
        "term": query,
        "retmax": limit,
        "retmode": "json",
        "tool": "researchos",
        "email": EMAIL,
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(f"{base}/esearch.fcgi", params=params_search)
            r.raise_for_status()
            ids = r.json().get("esearchresult", {}).get("idlist", [])
            if not ids:
                return []

            r2 = await client.get(f"{base}/esummary.fcgi", params={
                "db": "pubmed",
                "id": ",".join(ids),
                "retmode": "json",
                "tool": "researchos",
                "email": EMAIL,
            })
            r2.raise_for_status()
            summary = r2.json()
    except Exception:
        return []

    results = []
    uids = summary.get("result", {}).get("uids", [])
    for uid in uids:
        item = summary["result"].get(uid, {})
        authors = [a.get("name", "") for a in item.get("authors", [])]
        doi = next((i.get("value") for i in item.get("articleids", []) if i.get("idtype") == "doi"), None)
        results.append({
            "title": item.get("title", ""),
            "authors": authors,
            "year": item.get("pubdate", "")[:4] or None,
            "abstract": "",
            "url": f"https://pubmed.ncbi.nlm.nih.gov/{uid}/",
            "pdf_url": None,
            "doi": doi,
            "source": "PubMed",
        })
    return results


async def get_crossref_citation(doi: str, style: str = "apa") -> str:
    accept = {
        "apa": "text/x-bibliography; style=apa",
        "mla": "text/x-bibliography; style=modern-language-association",
        "chicago": "text/x-bibliography; style=chicago-author-date",
    }.get(style, "text/x-bibliography; style=apa")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"https://doi.org/{doi}",
                headers={"Accept": accept},
                follow_redirects=True,
            )
            if r.status_code == 200:
                return r.text.strip()
    except Exception:
        pass
    return ""


async def get_unpaywall_pdf(doi: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"https://api.unpaywall.org/v2/{doi}",
                params={"email": EMAIL},
            )
            if r.status_code == 200:
                data = r.json()
                best = data.get("best_oa_location")
                if best:
                    return best.get("url_for_pdf") or best.get("url")
    except Exception:
        pass
    return None


async def search_all_papers(query: str, limit_each: int = 15) -> list[dict]:
    results = await asyncio.gather(
        search_semantic_scholar(query, limit_each),
        search_arxiv(query, limit_each),
        search_pubmed(query, limit_each),
        return_exceptions=True,
    )
    combined = []
    for r in results:
        if isinstance(r, list):
            combined.extend(r)
    return combined

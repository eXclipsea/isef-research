import httpx

SEARXNG_URL = "http://localhost:8080/search"


async def searxng_search(query: str, count: int = 30, categories: str = "general") -> list[dict]:
    """Fetch up to `count` results, paginating SearXNG (≈10-20 per page)."""
    results: list[dict] = []
    seen: set[str] = set()
    max_pages = 6
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            for page in range(1, max_pages + 1):
                if len(results) >= count:
                    break
                r = await client.get(SEARXNG_URL, params={
                    "q": query,
                    "format": "json",
                    "categories": categories,
                    "pageno": page,
                })
                r.raise_for_status()
                items = r.json().get("results", [])
                if not items:
                    break
                for item in items:
                    url = item.get("url", "")
                    if not url or url in seen:
                        continue
                    seen.add(url)
                    results.append({
                        "title": item.get("title", ""),
                        "url": url,
                        "snippet": item.get("content", ""),
                        "source": item.get("engine", "searxng"),
                    })
    except Exception:
        pass
    return results[:count]


async def searxng_papers(query: str, count: int = 20) -> list[dict]:
    return await searxng_search(query, count=count, categories="science")


async def searxng_status() -> dict:
    """Check whether the local SearXNG instance is reachable."""
    try:
        async with httpx.AsyncClient(timeout=4) as client:
            r = await client.get(SEARXNG_URL, params={"q": "ping", "format": "json"})
            r.raise_for_status()
        return {"ok": True, "error": None}
    except Exception:
        return {
            "ok": False,
            "error": "SearXNG isn't reachable on :8080. Start it via ./start.sh.",
        }

import httpx

SEARXNG_URL = "http://localhost:8080/search"


async def searxng_search(query: str, count: int = 10, categories: str = "general") -> list[dict]:
    params = {
        "q": query,
        "format": "json",
        "categories": categories,
        "pageno": 1,
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(SEARXNG_URL, params=params)
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        return []

    results = []
    for item in data.get("results", [])[:count]:
        results.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "snippet": item.get("content", ""),
            "source": item.get("engine", "searxng"),
        })
    return results


async def searxng_papers(query: str, count: int = 10) -> list[dict]:
    return await searxng_search(query, count=count, categories="science")

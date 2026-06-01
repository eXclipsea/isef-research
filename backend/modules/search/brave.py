import os
import httpx

BRAVE_API_URL = "https://api.search.brave.com/res/v1/web/search"


async def brave_search(query: str, count: int = 10) -> list[dict]:
    api_key = os.getenv("BRAVE_API_KEY", "")
    if not api_key:
        return []

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            BRAVE_API_URL,
            params={"q": query, "count": count},
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "X-Subscription-Token": api_key,
            },
        )
        r.raise_for_status()
        data = r.json()

    results = []
    for item in data.get("web", {}).get("results", []):
        results.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "snippet": item.get("description", ""),
            "source": "brave",
        })
    return results

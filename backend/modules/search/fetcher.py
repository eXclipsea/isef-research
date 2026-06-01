import httpx
from bs4 import BeautifulSoup

MAX_CHARS = 2000

_BOILERPLATE_TAGS = ["nav", "footer", "header", "aside", "script", "style", "noscript"]


async def fetch_page_text(url: str) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (ResearchOS/1.0; academic research tool)"
    }
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            r = await client.get(url, headers=headers)
            r.raise_for_status()
            html = r.text
    except Exception as e:
        return f"Failed to fetch: {e}"

    soup = BeautifulSoup(html, "lxml")
    for tag in soup(_BOILERPLATE_TAGS):
        tag.decompose()

    # prefer article/main content
    main = soup.find("article") or soup.find("main") or soup.find("div", {"id": "content"})
    target = main if main else soup.body or soup
    text = target.get_text(separator=" ", strip=True)

    # collapse whitespace
    import re
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:MAX_CHARS]

from ..llm import chat, OllamaUnavailable


def build_synthesis_prompt(query: str, sources: list[dict]) -> str:
    numbered = []
    for i, s in enumerate(sources, 1):
        snippet = s.get("snippet") or s.get("abstract") or ""
        numbered.append(f"[{i}] {s['title']}\n{snippet[:400]}")
    context = "\n\n".join(numbered)
    return (
        f"You are a research assistant. Based on the sources below, write a clear and concise "
        f"summary answering the query. Use inline citations like [1], [2] etc. "
        f"Only cite sources that are relevant.\n\n"
        f"Query: {query}\n\nSources:\n{context}\n\nSummary:"
    )


def synthesize(query: str, sources: list[dict]) -> str:
    if not sources:
        return "_No sources found for this query. Try different keywords, or check that SearXNG is running._"
    prompt = build_synthesis_prompt(query, sources)
    try:
        return chat(prompt)
    except OllamaUnavailable as e:
        return f"_AI summary unavailable — {e}_\n\nThe sources below were still found."


def extract_topics(query: str, sources: list[dict]) -> dict:
    """Given selected sources (with fetched full text), produce key topics."""
    if not sources:
        return {"topics": [], "overview": "No sources selected."}

    blocks = []
    for i, s in enumerate(sources, 1):
        body = s.get("text") or s.get("snippet") or s.get("abstract") or ""
        blocks.append(f"[{i}] {s.get('title', 'Untitled')}\n{body[:1800]}")
    context = "\n\n".join(blocks)

    prompt = (
        f"You are a research assistant helping with a science research project on: \"{query}\".\n"
        f"Read the selected sources below and extract the KEY TOPICS a researcher should know.\n"
        f"Respond in this exact format:\n"
        f"OVERVIEW: <2-3 sentence overview>\n"
        f"TOPICS:\n"
        f"- <topic 1>: <one sentence explanation with [source number]>\n"
        f"- <topic 2>: <one sentence explanation with [source number]>\n"
        f"(give 5-8 topics)\n\n"
        f"Sources:\n{context}"
    )
    try:
        content = chat(prompt)
    except OllamaUnavailable as e:
        return {"topics": [], "overview": f"Key-topic extraction unavailable — {e}"}

    overview = ""
    topics = []
    for line in content.split("\n"):
        line = line.strip()
        if line.upper().startswith("OVERVIEW:"):
            overview = line.split(":", 1)[1].strip()
        elif line.startswith("-") or line.startswith("•"):
            topics.append(line.lstrip("-•").strip())
    if not topics:
        topics = [l.strip() for l in content.split("\n") if l.strip()]
    return {"topics": topics, "overview": overview}

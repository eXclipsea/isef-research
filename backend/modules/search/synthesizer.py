import ollama

CHAT_MODEL = "llama3.2"


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
        return "No sources available to synthesize."
    prompt = build_synthesis_prompt(query, sources)
    response = ollama.chat(
        model=CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    return response["message"]["content"]

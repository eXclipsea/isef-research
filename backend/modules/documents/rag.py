from pathlib import Path

import chromadb
import ollama

VECTORDB_DIR = Path(__file__).parent.parent.parent / "data" / "vectordb"
VECTORDB_DIR.mkdir(parents=True, exist_ok=True)

_client = chromadb.PersistentClient(path=str(VECTORDB_DIR))

EMBED_MODEL = "nomic-embed-text"
CHAT_MODEL = "llama3.2"


def _collection(doc_id: str):
    return _client.get_or_create_collection(
        name=f"doc_{doc_id}",
        metadata={"hnsw:space": "cosine"},
    )


def embed_text(text: str) -> list[float]:
    resp = ollama.embed(model=EMBED_MODEL, input=text)
    return resp["embeddings"][0]


def ingest_chunks(doc_id: str, chunks: list[dict]):
    col = _collection(doc_id)
    ids, embeddings, documents, metadatas = [], [], [], []
    for chunk in chunks:
        chunk_id = f"{doc_id}_p{chunk['page']}_c{chunk['chunk_index']}"
        ids.append(chunk_id)
        embeddings.append(embed_text(chunk["text"]))
        documents.append(chunk["text"])
        metadatas.append({
            "page": chunk["page"],
            "chunk_index": chunk["chunk_index"],
        })
    col.add(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)


def query_document(doc_id: str, filename: str, question: str, n_results: int = 5) -> dict:
    col = _collection(doc_id)
    q_embedding = embed_text(question)
    results = col.query(
        query_embeddings=[q_embedding],
        n_results=min(n_results, col.count()),
        include=["documents", "metadatas", "distances"],
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]

    context_parts = []
    citations = []
    for i, (doc, meta) in enumerate(zip(docs, metas)):
        tag = f"[{i+1}]"
        context_parts.append(f"{tag} {doc}")
        citations.append({
            "tag": tag,
            "filename": filename,
            "page": meta["page"],
            "chunk_index": meta["chunk_index"],
        })

    context = "\n\n".join(context_parts)
    prompt = (
        f"You are a research assistant. Answer the question using only the provided context. "
        f"Cite sources inline using the bracket numbers like [1], [2], etc.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}\n\nAnswer:"
    )

    response = ollama.chat(
        model=CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    answer = response["message"]["content"]

    return {"answer": answer, "citations": citations}


def delete_collection(doc_id: str):
    try:
        _client.delete_collection(f"doc_{doc_id}")
    except Exception:
        pass


def extract_key_points(filename: str, chunks: list[dict], n_chunks: int = 10) -> list[str]:
    sample = chunks[:n_chunks]
    text = "\n\n".join(c["text"] for c in sample)
    prompt = (
        f"Extract the 7 most important key points from this research paper excerpt. "
        f"Format as a numbered list. Be concise and specific.\n\n{text}"
    )
    response = ollama.chat(
        model=CHAT_MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    content = response["message"]["content"]
    lines = [l.strip() for l in content.split("\n") if l.strip()]
    return [l for l in lines if l[0].isdigit() or l.startswith("-")]

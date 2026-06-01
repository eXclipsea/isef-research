"""Shared Ollama helpers with graceful failure handling."""
import ollama

CHAT_MODEL = "llama3.2"
EMBED_MODEL = "nomic-embed-text"


class OllamaUnavailable(Exception):
    """Raised when Ollama is not running or the model is missing."""


def ollama_status() -> dict:
    """Return {ok, models, error} describing local Ollama availability."""
    try:
        data = ollama.list()
        models = [m.get("model", m.get("name", "")) for m in data.get("models", [])]
        return {"ok": True, "models": models, "error": None}
    except Exception as e:
        return {"ok": False, "models": [], "error": _friendly(e)}


def _friendly(e: Exception) -> str:
    msg = str(e)
    if "connect" in msg.lower() or "refused" in msg.lower() or "11434" in msg:
        return (
            "Ollama isn't running. Start it with `ollama serve` (or just rerun "
            "./start.sh), then try again."
        )
    if "not found" in msg.lower() or "no such model" in msg.lower():
        return (
            "A required model isn't installed. Run `ollama pull llama3.2` and "
            "`ollama pull nomic-embed-text`."
        )
    return f"Ollama error: {msg}"


def chat(prompt: str, model: str = CHAT_MODEL) -> str:
    try:
        resp = ollama.chat(model=model, messages=[{"role": "user", "content": prompt}])
        return resp["message"]["content"]
    except Exception as e:
        raise OllamaUnavailable(_friendly(e)) from e


def embed(text: str, model: str = EMBED_MODEL) -> list[float]:
    try:
        resp = ollama.embed(model=model, input=text)
        return resp["embeddings"][0]
    except Exception as e:
        raise OllamaUnavailable(_friendly(e)) from e

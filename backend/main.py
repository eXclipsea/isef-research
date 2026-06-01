from contextlib import asynccontextmanager
from pathlib import Path

import ollama
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from modules.notes.db import init_db
from modules.notes.router import router as notes_router
from modules.documents.router import router as documents_router
from modules.search.router import router as search_router

load_dotenv()

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    for model in ["llama3.2", "nomic-embed-text"]:
        try:
            ollama.show(model)
        except Exception:
            print(f"Pulling {model}…")
            ollama.pull(model)
            print(f"{model} ready.")
    yield


app = FastAPI(title="ResearchOS", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notes_router, prefix="/notes", tags=["notes"])
app.include_router(documents_router, prefix="/documents", tags=["documents"])
app.include_router(search_router, prefix="/search", tags=["search"])

uploads_dir = DATA_DIR / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/files", StaticFiles(directory=str(uploads_dir)), name="files")


@app.get("/health")
def health():
    return {"status": "ok"}


# Serve built React frontend — must be last
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        return FileResponse(str(FRONTEND_DIST / "index.html"))

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .db import get_conn, row_to_dict, upsert_backlinks

router = APIRouter()

NOTES_DIR = Path(__file__).parent.parent.parent / "data" / "notes"
NOTES_DIR.mkdir(parents=True, exist_ok=True)


class NoteCreate(BaseModel):
    title: str
    content: str = ""
    tags: list[str] = []
    folder: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[list[str]] = None
    folder: Optional[str] = None
    # sentinel allows clearing the folder (move to root) by sending folder=""



@router.get("")
def list_notes(tag: Optional[str] = None):
    with get_conn() as conn:
        if tag:
            rows = conn.execute(
                "SELECT * FROM notes WHERE tags_json LIKE ? ORDER BY updated_at DESC",
                (f'%"{tag}"%',),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM notes ORDER BY updated_at DESC"
            ).fetchall()
    return [row_to_dict(r) for r in rows]


@router.post("")
def create_note(body: NoteCreate):
    note_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    filename = f"{note_id}.md"
    filepath = NOTES_DIR / filename
    filepath.write_text(body.content, encoding="utf-8")

    folder = body.folder or None
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO notes (id, title, filename, created_at, updated_at, tags_json, folder) VALUES (?,?,?,?,?,?,?)",
            (note_id, body.title, filename, now, now, json.dumps(body.tags), folder),
        )
        upsert_backlinks(conn, note_id, body.content)

    return {"id": note_id, "title": body.title, "filename": filename,
            "created_at": now, "updated_at": now, "tags": body.tags,
            "folder": folder, "content": body.content}


@router.get("/search")
def search_notes(q: str = ""):
    if not q:
        return []
    pattern = f"%{q}%"
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM notes WHERE title LIKE ? OR id IN ("
            "  SELECT id FROM notes"
            ") ORDER BY updated_at DESC",
            (pattern,),
        ).fetchall()

    # also search file contents
    results = []
    with get_conn() as conn:
        all_rows = conn.execute("SELECT * FROM notes").fetchall()
    for row in all_rows:
        d = row_to_dict(row)
        filepath = NOTES_DIR / d["filename"]
        content = filepath.read_text(encoding="utf-8") if filepath.exists() else ""
        if q.lower() in d["title"].lower() or q.lower() in content.lower():
            d["content"] = content
            results.append(d)
    return results


@router.get("/{note_id}")
def get_note(note_id: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Note not found")
    d = row_to_dict(row)
    filepath = NOTES_DIR / d["filename"]
    d["content"] = filepath.read_text(encoding="utf-8") if filepath.exists() else ""
    return d


@router.put("/{note_id}")
def update_note(note_id: str, body: NoteUpdate):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Note not found")
        d = row_to_dict(row)
        now = datetime.now(timezone.utc).isoformat()

        new_title = body.title if body.title is not None else d["title"]
        new_tags = body.tags if body.tags is not None else d["tags"]
        # folder: None means "unchanged"; empty string means "move to root"
        if body.folder is None:
            new_folder = d.get("folder")
        else:
            new_folder = body.folder or None

        filepath = NOTES_DIR / d["filename"]
        if body.content is not None:
            filepath.write_text(body.content, encoding="utf-8")
            upsert_backlinks(conn, note_id, body.content)
        content = filepath.read_text(encoding="utf-8") if filepath.exists() else ""

        conn.execute(
            "UPDATE notes SET title=?, updated_at=?, tags_json=?, folder=? WHERE id=?",
            (new_title, now, json.dumps(new_tags), new_folder, note_id),
        )

    return {"id": note_id, "title": new_title, "filename": d["filename"],
            "created_at": d["created_at"], "updated_at": now,
            "tags": new_tags, "folder": new_folder, "content": content}


@router.delete("/{note_id}")
def delete_note(note_id: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Note not found")
        d = row_to_dict(row)
        filepath = NOTES_DIR / d["filename"]
        if filepath.exists():
            filepath.unlink()
        conn.execute("DELETE FROM backlinks WHERE from_id = ?", (note_id,))
        conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    return {"ok": True}


@router.get("/{note_id}/backlinks")
def get_backlinks(note_id: str):
    with get_conn() as conn:
        row = conn.execute("SELECT title FROM notes WHERE id = ?", (note_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Note not found")
        note_title = row["title"]
        # find all notes that have a [[link]] pointing to this note's title
        from_ids = conn.execute(
            "SELECT from_id FROM backlinks WHERE to_title = ?", (note_title,)
        ).fetchall()
        from_ids = [r["from_id"] for r in from_ids]
        if not from_ids:
            return []
        placeholders = ",".join("?" * len(from_ids))
        rows = conn.execute(
            f"SELECT * FROM notes WHERE id IN ({placeholders})", from_ids
        ).fetchall()
    return [row_to_dict(r) for r in rows]

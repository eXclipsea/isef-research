import json
import re
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "data" / "notes.db"


def get_conn():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                filename TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                tags_json TEXT NOT NULL DEFAULT '[]'
            );
            CREATE TABLE IF NOT EXISTS backlinks (
                from_id TEXT NOT NULL,
                to_title TEXT NOT NULL,
                PRIMARY KEY (from_id, to_title)
            );
            CREATE INDEX IF NOT EXISTS idx_backlinks_to ON backlinks(to_title);
        """)


def extract_wikilinks(content: str) -> list[str]:
    return re.findall(r'\[\[([^\]]+)\]\]', content)


def upsert_backlinks(conn, note_id: str, content: str):
    conn.execute("DELETE FROM backlinks WHERE from_id = ?", (note_id,))
    links = extract_wikilinks(content)
    for title in set(links):
        conn.execute(
            "INSERT OR IGNORE INTO backlinks (from_id, to_title) VALUES (?, ?)",
            (note_id, title),
        )


def row_to_dict(row) -> dict:
    d = dict(row)
    d["tags"] = json.loads(d.pop("tags_json", "[]"))
    return d

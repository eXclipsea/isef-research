from pathlib import Path
import fitz  # PyMuPDF


CHUNK_SIZE = 500   # characters (~125 tokens)
CHUNK_OVERLAP = 80


def extract_pages(pdf_path: str) -> list[dict]:
    """Return list of {page: int, text: str} for every page."""
    doc = fitz.open(pdf_path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text("text").strip()
        if text:
            pages.append({"page": i + 1, "text": text})
    doc.close()
    return pages


def chunk_pages(pages: list[dict]) -> list[dict]:
    """Chunk page text into overlapping segments.
    Returns list of {page, chunk_index, text}.
    """
    chunks = []
    chunk_idx = 0
    for page_data in pages:
        text = page_data["text"]
        page_num = page_data["page"]
        start = 0
        while start < len(text):
            end = start + CHUNK_SIZE
            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append({
                    "page": page_num,
                    "chunk_index": chunk_idx,
                    "text": chunk_text,
                })
                chunk_idx += 1
            start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def parse_pdf(pdf_path: str) -> list[dict]:
    pages = extract_pages(pdf_path)
    return chunk_pages(pages)

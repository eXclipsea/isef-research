"""Build APA / MLA / Chicago citations from a document's metadata.

We only have author display names (not parsed given/family), so this is
best-effort — but the three styles come out structurally distinct, which is
what matters for a school bibliography.
"""
import re


def _clean(s: str) -> str:
    s = re.sub(r"\.{2,}", ".", s)   # "n.d.." -> "n.d."
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _authors_str(authors: list[str], style: str) -> str:
    authors = [a for a in (authors or []) if a]
    if not authors:
        return ""
    if style == "apa":
        # "Smith, J., Doe, A., & Lee, K."
        formatted = [_lastfirst(a) for a in authors[:7]]
        if len(formatted) == 1:
            return formatted[0]
        return ", ".join(formatted[:-1]) + ", & " + formatted[-1]
    if style == "mla":
        if len(authors) == 1:
            return _lastfirst(authors[0])
        if len(authors) == 2:
            return f"{_lastfirst(authors[0])}, and {authors[1]}"
        return f"{_lastfirst(authors[0])}, et al"
    # chicago
    if len(authors) == 1:
        return _lastfirst(authors[0])
    if len(authors) <= 3:
        return ", ".join(_lastfirst(a) if i == 0 else a for i, a in enumerate(authors))
    return f"{_lastfirst(authors[0])}, et al"


def _lastfirst(name: str) -> str:
    """'John Smith' -> 'Smith, J.' (APA-ish) / 'Smith, John' kept simple."""
    parts = name.strip().split()
    if len(parts) < 2:
        return name.strip()
    last = parts[-1]
    initials = " ".join(f"{p[0]}." for p in parts[:-1] if p)
    return f"{last}, {initials}"


def format_citation(meta: dict, style: str = "apa") -> str:
    style = (style or "apa").lower()
    title = (meta.get("title") or re.sub(r"\.pdf$", "", meta.get("filename", ""), flags=re.I)).strip()
    authors = meta.get("authors") or []
    year = meta.get("year")
    source = (meta.get("source") or "").strip()
    url = (meta.get("url") or "").strip()
    doi = meta.get("doi")
    locator = f"https://doi.org/{doi}" if doi else url

    a = _authors_str(authors, style)
    yr = str(year) if year else "n.d."

    if style == "apa":
        # Authors (Year). Title. Source. URL
        bits = []
        if a:
            bits.append(f"{a} ({yr}).")
        else:
            bits.append(f"({yr}).")
        bits.append(f"{title}.")
        if source:
            bits.append(f"{source}.")
        if locator:
            bits.append(locator)
        return _clean(" ".join(bits))

    if style == "mla":
        # Author(s). "Title." Source, Year, URL.
        bits = []
        if a:
            bits.append(f"{a}.")
        bits.append(f'"{title}."')
        tail = source if source else ""
        tail = f"{tail}, {yr}" if tail else yr
        bits.append(f"{tail}.")
        if locator:
            bits.append(f"{locator}.")
        return _clean(" ".join(bits))

    # chicago (author-date)
    bits = []
    if a:
        bits.append(f"{a}.")
    bits.append(f'"{title}."')
    if source:
        bits.append(f"{source}")
    bits.append(f"({yr}).")
    if locator:
        bits.append(locator + ".")
    return _clean(" ".join(bits))

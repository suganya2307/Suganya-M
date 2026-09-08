import csv, io, json
from pathlib import Path

def extract_text(filename: str, content: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        from pypdf import PdfReader
        return "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(content)).pages)
    if suffix == ".docx":
        from docx import Document
        return "\n".join(p.text for p in Document(io.BytesIO(content)).paragraphs)
    text = content.decode("utf-8", errors="replace")
    if suffix == ".json":
        try: return json.dumps(json.loads(text), indent=2)
        except json.JSONDecodeError: return text
    if suffix == ".csv":
        rows = list(csv.reader(io.StringIO(text)))
        return "\n".join(" | ".join(row) for row in rows)
    return text
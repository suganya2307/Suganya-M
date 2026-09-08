import re
from collections import Counter

def chunks(text: str, size: int = 800) -> list[str]:
    words = text.split()
    return [" ".join(words[i:i + size // 5]) for i in range(0, len(words), size // 5)] or [""]

def retrieve(question: str, documents: list[dict], limit: int = 4) -> list[dict]:
    terms = set(re.findall(r"[a-zA-Z0-9+#.-]{3,}", question.lower()))
    scored = []
    for doc in documents:
        words = re.findall(r"[a-zA-Z0-9+#.-]{3,}", doc.get("content", "").lower())
        counts = Counter(words)
        score = sum(counts[t] for t in terms) / max(1, len(words) ** .5)
        if score:
            scored.append((score, doc))
    return [d for _, d in sorted(scored, key=lambda x: x[0], reverse=True)[:limit]]
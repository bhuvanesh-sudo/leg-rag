"""
ingestion.py — PyMuPDF-based PDF ingestion preserving legal document structure.
"""

import re
import fitz
from dataclasses import dataclass, field
from typing import Optional


HEADING_PATTERNS = [
    re.compile(r"^\s*(?:SECTION|ARTICLE|CLAUSE|PART|SCHEDULE|EXHIBIT|ANNEX)\s+[\dIVXivx]+", re.I),
    re.compile(r"^\s*\d+\.\s+[A-Z]"),
    re.compile(r"^\s*\d+\.\d+\.?\s+[A-Z]"),
    re.compile(r"^\s*\([a-z]\)\s"),
    re.compile(r"^\s*[IVXLCDM]+\.\s+[A-Z]"),
]


@dataclass
class TextBlock:
    text: str
    page: int
    is_heading: bool
    heading_level: int
    font_size: float
    clause_ref: Optional[str]
    bbox: tuple = field(default_factory=tuple)


def _detect_heading(text: str, font_size: float, body_font_size: float):
    stripped = text.strip()
    if not stripped:
        return False, 0
    size_ratio = font_size / body_font_size if body_font_size else 1.0
    size_signal = size_ratio > 1.08
    for pat in HEADING_PATTERNS:
        if pat.match(stripped):
            return True, (1 if size_signal else 2)
    if stripped.isupper() and len(stripped.split()) <= 6 and size_signal:
        return True, 1
    return False, 0


def _extract_clause_ref(text: str) -> Optional[str]:
    patterns = [
        re.compile(r"^\s*((?:SECTION|ARTICLE|CLAUSE|PART)\s+[\dIVXivx]+)", re.I),
        re.compile(r"^\s*(\d+(?:\.\d+)*)\.?\s"),
        re.compile(r"^\s*([IVXLCDM]+)\.\s", re.I),
    ]
    for pat in patterns:
        m = pat.match(text)
        if m:
            return m.group(1).strip()
    return None


def load_pdf(path: str) -> list[TextBlock]:
    doc = fitz.open(path)
    all_blocks: list[TextBlock] = []

    font_sizes = []
    for page in doc:
        for block in page.get_text("dict")["blocks"]:
            if block["type"] != 0:
                continue
            for line in block["lines"]:
                for span in line["spans"]:
                    font_sizes.append(span["size"])

    from statistics import mode
    try:
        body_size = mode(font_sizes) if font_sizes else 11.0
    except Exception:
        body_size = sorted(font_sizes)[len(font_sizes) // 2] if font_sizes else 11.0

    for page_num, page in enumerate(doc, start=1):
        for block in page.get_text("dict")["blocks"]:
            if block["type"] != 0:
                continue
            parts = []
            block_font_size = body_size
            for line in block["lines"]:
                line_text = ""
                for span in line["spans"]:
                    line_text += span["text"]
                    block_font_size = max(block_font_size, span["size"])
                parts.append(line_text)
            raw = "\n".join(parts).strip()
            if not raw:
                continue
            is_heading, level = _detect_heading(raw, block_font_size, body_size)
            clause_ref = _extract_clause_ref(raw) if is_heading else None
            all_blocks.append(TextBlock(
                text=raw, page=page_num, is_heading=is_heading,
                heading_level=level, font_size=block_font_size,
                clause_ref=clause_ref, bbox=tuple(block["bbox"]),
            ))

    doc.close()
    return all_blocks


def extract_text_simple(path: str) -> str:
    doc = fitz.open(path)
    text = "".join(page.get_text() for page in doc)
    doc.close()
    return text

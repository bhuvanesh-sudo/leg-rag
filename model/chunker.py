"""
chunker.py — Clause-aware chunking for legal documents.

Groups TextBlocks into clause units (heading + body), then sub-splits
oversized units while preserving the heading as a prefix on each child chunk.
Produces LangChain Document objects with rich metadata.
"""

from __future__ import annotations
from typing import Optional
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from ingestion import TextBlock

MAX_CHUNK_CHARS = 900
CHUNK_OVERLAP   = 100

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=MAX_CHUNK_CHARS,
    chunk_overlap=CHUNK_OVERLAP,
    separators=["\n\n", "\n", ". ", " "],
)


def _make_doc(text: str, page: int, clause_ref: Optional[str],
              section_title: str, doc_id: str, chunk_index: int) -> Document:
    return Document(
        page_content=text,
        metadata={
            "page": page,
            "clause_ref": clause_ref or "",
            "section_title": section_title,
            "doc_id": doc_id,
            "chunk_index": chunk_index,
            "citation": f"§{clause_ref}, p.{page}" if clause_ref else f"p.{page}",
        },
    )


def chunk_blocks(blocks: list[TextBlock], doc_id: str = "doc") -> list[Document]:
    """
    Walk TextBlock list, group into clause units, sub-split long ones.
    Returns a flat list of LangChain Documents.
    """
    # Group blocks into clause units: each unit starts at a heading
    units: list[dict] = []
    current: dict = {"heading": None, "clause_ref": None, "page": 1, "body": []}

    for blk in blocks:
        if blk.is_heading:
            if current["body"] or current["heading"]:
                units.append(current)
            current = {
                "heading": blk.text,
                "clause_ref": blk.clause_ref,
                "page": blk.page,
                "body": [],
            }
        else:
            current["body"].append(blk.text)
            # Track earliest page of this unit
            if not current["heading"]:
                current["page"] = blk.page

    if current["body"] or current["heading"]:
        units.append(current)

    # Convert units → Documents
    docs: list[Document] = []
    chunk_index = 0

    for unit in units:
        heading  = unit["heading"] or ""
        body     = "\n\n".join(unit["body"])
        full     = f"{heading}\n\n{body}".strip() if heading else body.strip()
        page     = unit["page"]
        ref      = unit["clause_ref"]
        title    = heading.split("\n")[0][:80] if heading else ""

        if len(full) <= MAX_CHUNK_CHARS:
            docs.append(_make_doc(full, page, ref, title, doc_id, chunk_index))
            chunk_index += 1
        else:
            # Sub-split body, prefix each piece with heading
            sub_texts = _splitter.split_text(body)
            for sub in sub_texts:
                text = f"{heading}\n\n{sub}".strip() if heading else sub.strip()
                docs.append(_make_doc(text, page, ref, title, doc_id, chunk_index))
                chunk_index += 1

    return docs

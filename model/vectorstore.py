"""
vectorstore.py — FAISS vector store with persistence and per-document namespacing.

Each uploaded document gets its own index saved to disk.
On startup, existing indexes are loaded rather than rebuilt.
"""

from __future__ import annotations
import os
import json
from pathlib import Path

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

INDEX_DIR = Path(os.getenv("INDEX_DIR", "./indexes"))
INDEX_DIR.mkdir(parents=True, exist_ok=True)

EMBEDDING_MODEL = "all-MiniLM-L6-v2"

_embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

# In-memory registry: doc_id -> FAISS instance
_stores: dict[str, FAISS] = {}


def _index_path(doc_id: str) -> Path:
    return INDEX_DIR / doc_id


def build_index(doc_id: str, chunks: list[Document]) -> FAISS:
    """Build a new FAISS index from chunks and persist it."""
    store = FAISS.from_documents(chunks, _embeddings)
    store.save_local(str(_index_path(doc_id)))
    _stores[doc_id] = store

    # Save metadata manifest
    manifest = {
        "doc_id": doc_id,
        "num_chunks": len(chunks),
        "pages": sorted({c.metadata.get("page", 0) for c in chunks}),
    }
    (_index_path(doc_id) / "manifest.json").write_text(json.dumps(manifest))
    return store


def load_index(doc_id: str) -> FAISS | None:
    """Load a persisted index from disk. Returns None if not found."""
    if doc_id in _stores:
        return _stores[doc_id]
    path = _index_path(doc_id)
    if not path.exists():
        return None
    store = FAISS.load_local(str(path), _embeddings, allow_dangerous_deserialization=True)
    _stores[doc_id] = store
    return store


def get_or_build(doc_id: str, chunks: list[Document]) -> FAISS:
    existing = load_index(doc_id)
    if existing:
        return existing
    return build_index(doc_id, chunks)


def list_indexed_docs() -> list[dict]:
    """Return manifests for all persisted indexes."""
    result = []
    for p in INDEX_DIR.iterdir():
        manifest_path = p / "manifest.json"
        if manifest_path.exists():
            result.append(json.loads(manifest_path.read_text()))
    return result


def get_retriever(doc_id: str, k: int = 6):
    """Return a retriever for a given document."""
    store = load_index(doc_id)
    if store is None:
        raise ValueError(f"No index found for doc_id={doc_id!r}")
    return store.as_retriever(search_kwargs={"k": k})

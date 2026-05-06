"""
retriever.py — Two-stage retrieval: FAISS semantic search + cross-encoder reranking.

Stage 1: Retrieve top-K candidates from FAISS (broad, fast).
Stage 2: Rerank with a cross-encoder (precise, slower) and return top-N.

Falls back to FAISS-only if sentence-transformers cross-encoder is unavailable.
"""

from __future__ import annotations
from langchain_core.documents import Document
import vectorstore as vs


def retrieve(
    query: str,
    doc_id: str,
    initial_k: int = 12,
    final_k: int = 5,
    use_reranker: bool = True,
) -> list[Document]:
    """
    Retrieve and rerank documents for a query against a specific doc index.
    Returns up to final_k documents ordered by relevance.
    """
    store = vs.load_index(doc_id)
    if store is None:
        raise ValueError(f"No index for doc_id={doc_id!r}. Ingest the document first.")

    # Stage 1: semantic retrieval
    candidates = store.similarity_search(query, k=initial_k)

    if not use_reranker or len(candidates) <= final_k:
        return candidates[:final_k]

    # Stage 2: cross-encoder reranking
    try:
        from sentence_transformers import CrossEncoder
        _reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        pairs = [(query, doc.page_content) for doc in candidates]
        scores = _reranker.predict(pairs)
        ranked = sorted(zip(scores, candidates), key=lambda x: x[0], reverse=True)
        return [doc for _, doc in ranked[:final_k]]
    except ImportError:
        # sentence-transformers not installed — fall back gracefully
        return candidates[:final_k]
    except Exception:
        return candidates[:final_k]


def retrieve_for_comparison(
    query: str,
    doc_id_a: str,
    doc_id_b: str,
    k: int = 4,
) -> tuple[list[Document], list[Document]]:
    """Retrieve relevant chunks from two documents simultaneously."""
    docs_a = retrieve(query, doc_id_a, final_k=k, use_reranker=False)
    docs_b = retrieve(query, doc_id_b, final_k=k, use_reranker=False)
    return docs_a, docs_b

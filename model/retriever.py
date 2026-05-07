"""
retriever.py — Two-stage retrieval: FAISS MMR + cross-encoder reranking.

Stage 1: MMR (maximal marginal relevance) retrieval — penalises redundant chunks
         so you never get the same clause returned multiple times.
Stage 2: Cross-encoder reranking for precision (falls back gracefully).
"""

from __future__ import annotations
from langchain_core.documents import Document
import vectorstore as vs


def _deduplicate(docs: list[Document]) -> list[Document]:
    """
    Hard dedup by citation key. If two chunks share the same §ref+page
    (i.e. they are fragments of the same clause), keep only the first/longest.
    """
    seen: set[str] = set()
    out: list[Document] = []
    for doc in docs:
        key = doc.metadata.get("citation", doc.page_content[:60])
        if key not in seen:
            seen.add(key)
            out.append(doc)
    return out


def retrieve(
    query: str,
    doc_id: str,
    initial_k: int = 10,
    final_k: int = 4,
    use_reranker: bool = True,
) -> list[Document]:
    """
    Retrieve relevant, non-redundant chunks for a query.
    Uses MMR to avoid returning duplicate or near-duplicate clauses.
    """
    store = vs.load_index(doc_id)
    if store is None:
        raise ValueError(f"No index for doc_id={doc_id!r}. Ingest the document first.")

    # Stage 1: MMR retrieval — lambda=0.6 balances relevance vs diversity
    try:
        candidates = store.max_marginal_relevance_search(
            query,
            k=initial_k,
            fetch_k=initial_k * 3,   # wider candidate pool for MMR to choose from
            lambda_mult=0.6,          # 0=max diversity, 1=max relevance
        )
    except Exception:
        # FAISS index might not support MMR in all versions — fall back
        candidates = store.similarity_search(query, k=initial_k)

    # Hard dedup on citation key as a safety net
    candidates = _deduplicate(candidates)

    if not use_reranker or len(candidates) <= final_k:
        return candidates[:final_k]

    # Stage 2: cross-encoder reranking
    try:
        from sentence_transformers import CrossEncoder
        reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
        pairs = [(query, doc.page_content) for doc in candidates]
        scores = reranker.predict(pairs)
        ranked = sorted(zip(scores, candidates), key=lambda x: x[0], reverse=True)
        return _deduplicate([doc for _, doc in ranked])[:final_k]
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
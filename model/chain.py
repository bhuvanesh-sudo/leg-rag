"""
chain.py — Core reasoning chains connecting retrieval and LLM generation.

Provides:
  - answer_question()   Plain-English Q&A with citations
  - analyze_risks()     Full risk scan of the document
  - worry_list()        "What should I worry about?" summary
  - compare_docs()      Two-document comparison
  - chat()              Conversational Q&A with memory
"""

from __future__ import annotations
import os
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from llm import GroqLLM
from prompts import QA_TEMPLATE, RISK_TEMPLATE, WORRY_TEMPLATE, COMPARE_TEMPLATE, CHAT_TEMPLATE
import retriever as ret
import memory as mem
import risk as risk_mod
from dotenv import load_dotenv

load_dotenv()

_llm = GroqLLM(api_key=os.environ["API_KEY"])
_parser = StrOutputParser()

DISCLAIMER = (
    "\n\n---\n⚠ *This is an educational explanation, not legal advice. "
    "Consult a qualified attorney before making decisions based on this document.*"
)


def _format_docs(docs: list[Document]) -> str:
    parts = []
    for doc in docs:
        citation = doc.metadata.get("citation", "")
        parts.append(f"[{citation}]\n{doc.page_content}")
    return "\n\n---\n\n".join(parts)


def _confidence_note(docs: list[Document]) -> str:
    if not docs:
        return "\n\n*No relevant clauses found — answer may not be grounded.*"
    if len(docs) < 2:
        return "\n\n*Low retrieval confidence — based on limited context.*"
    return ""


# ── Q&A ──────────────
def answer_question(question: str, doc_id: str, session_id: str | None = None) -> dict:
    docs = ret.retrieve(question, doc_id)
    if not docs:
        return {
            "answer": "I couldn't find relevant information in the document for that question.",
            "sources": [],
            "confidence": "none",
        }

    context = _format_docs(docs)
    chain = QA_TEMPLATE | _llm | _parser
    answer = chain.invoke({"context": context, "question": question})
    answer += _confidence_note(docs) + DISCLAIMER

    if session_id:
        mem.add_turn(session_id, "user", question)
        mem.add_turn(session_id, "assistant", answer)

    sources = [
        {
            "citation": d.metadata.get("citation", ""),
            "section": d.metadata.get("section_title", ""),
            "page": d.metadata.get("page", ""),
            "excerpt": d.page_content[:300],
        }
        for d in docs
    ]
    return {
        "answer": answer,
        "sources": sources,
        "confidence": "high" if len(docs) >= 3 else "medium",
    }


# ── Conversational Q&A ───────────────────────────────────────────────────────
def chat(question: str, doc_id: str, session_id: str) -> dict:
    docs = ret.retrieve(question, doc_id)
    context = _format_docs(docs) if docs else "(no relevant clauses retrieved)"
    history = mem.format_history(session_id)

    chain = CHAT_TEMPLATE | _llm | _parser
    answer = chain.invoke({"context": context, "history": history, "question": question})
    answer += DISCLAIMER

    mem.add_turn(session_id, "user", question)
    mem.add_turn(session_id, "assistant", answer)

    return {
        "answer": answer,
        "sources": [
            {
                "citation": d.metadata.get("citation", ""),
                "section": d.metadata.get("section_title", ""),
                "page": d.metadata.get("page", ""),
                "excerpt": d.page_content[:300],
            }
            for d in docs
        ],
    }


# ── Risk Analysis ─────
def analyze_risks(doc_id: str, all_chunks: list[Document]) -> dict:
    # Phase 1: fast regex scan
    flags = risk_mod.scan_chunks(all_chunks)

    # Phase 2: LLM explanation for top flagged chunks
    flagged_texts = []
    for flag in flags[:8]:   # limit LLM calls
        flagged_texts.append(
            f"[{flag.clause_type} — {flag.citation}]\n{flag.excerpt}"
        )

    if flagged_texts:
        context = "\n\n---\n\n".join(flagged_texts)
        chain = RISK_TEMPLATE | _llm | _parser
        analysis = chain.invoke({"context": context})
    else:
        analysis = "No significant risk clauses were detected in this document."

    return {
        "flags": risk_mod.flags_to_dict(flags),
        "analysis": analysis + DISCLAIMER,
    }


# ── Worry List ────────
def worry_list(doc_id: str, all_chunks: list[Document]) -> dict:
    # Sample broadly across the document for the worry summary
    sample = all_chunks[:20]  # first 20 chunks cover intro + key clauses
    context = _format_docs(sample)
    chain = WORRY_TEMPLATE | _llm | _parser
    result = chain.invoke({"context": context})
    return {"summary": result + DISCLAIMER}


# ── Contract Comparison ────
def compare_docs(
    doc_id_a: str,
    doc_id_b: str,
    aspect: str = "obligations, compensation, termination, and liability",
) -> dict:
    docs_a, docs_b = ret.retrieve_for_comparison(aspect, doc_id_a, doc_id_b, k=6)
    context_a = _format_docs(docs_a)
    context_b = _format_docs(docs_b)

    chain = COMPARE_TEMPLATE | _llm | _parser
    result = chain.invoke({
        "context_a": context_a,
        "context_b": context_b,
        "aspect": aspect,
    })
    return {
        "comparison": result + DISCLAIMER,
        "sources_a": [d.metadata.get("citation", "") for d in docs_a],
        "sources_b": [d.metadata.get("citation", "") for d in docs_b],
    }

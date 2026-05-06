"""
api.py — FastAPI backend for the Legal RAG system.

Endpoints:
  POST /ingest          Upload and index a PDF
  POST /ask             Plain-English Q&A
  POST /chat            Conversational Q&A with memory
  POST /risks           Full risk scan
  POST /worry           "What should I worry about?" summary
  POST /compare         Two-document comparison
  GET  /docs-list       List indexed documents
  DELETE /session/{id}  Clear conversation memory
"""

from __future__ import annotations
import os
import uuid
import shutil
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

import vectorstore as vs
import chain as ch
from ingestion import load_pdf
from chunker import chunk_blocks

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="LegalLens API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory doc registry: doc_id -> {filename, chunks}
_doc_registry: dict[str, dict] = {}


# ── Ingest ────────────────────────────────────────────────────────────────────
@app.post("/ingest")
async def ingest(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")

    doc_id = str(uuid.uuid4())[:8]
    save_path = UPLOAD_DIR / f"{doc_id}.pdf"

    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        blocks = load_pdf(str(save_path))
        chunks = chunk_blocks(blocks, doc_id=doc_id)
        vs.build_index(doc_id, chunks)
        _doc_registry[doc_id] = {
            "doc_id": doc_id,
            "filename": file.filename,
            "num_chunks": len(chunks),
            "num_pages": max((c.metadata.get("page", 0) for c in chunks), default=0),
        }
    except Exception as e:
        save_path.unlink(missing_ok=True)
        raise HTTPException(500, f"Ingestion failed: {e}")

    return {
        "doc_id": doc_id,
        "filename": file.filename,
        "num_chunks": len(chunks),
        "message": "Document indexed successfully.",
    }


# ── Q&A ───────────────────────────────────────────────────────────────────────
class AskRequest(BaseModel):
    doc_id: str
    question: str
    session_id: str | None = None


@app.post("/ask")
async def ask(req: AskRequest):
    _require_doc(req.doc_id)
    result = ch.answer_question(req.question, req.doc_id, req.session_id)
    return result


# ── Chat (with memory) ────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    doc_id: str
    question: str
    session_id: str


@app.post("/chat")
async def chat(req: ChatRequest):
    _require_doc(req.doc_id)
    result = ch.chat(req.question, req.doc_id, req.session_id)
    return result


# ── Risk Analysis ─────────────────────────────────────────────────────────────
class DocRequest(BaseModel):
    doc_id: str


@app.post("/risks")
async def risks(req: DocRequest):
    _require_doc(req.doc_id)
    chunks = _get_chunks(req.doc_id)
    result = ch.analyze_risks(req.doc_id, chunks)
    return result


# ── Worry List ────────────────────────────────────────────────────────────────
@app.post("/worry")
async def worry(req: DocRequest):
    _require_doc(req.doc_id)
    chunks = _get_chunks(req.doc_id)
    result = ch.worry_list(req.doc_id, chunks)
    return result


# ── Comparison ────────────────────────────────────────────────────────────────
class CompareRequest(BaseModel):
    doc_id_a: str
    doc_id_b: str
    aspect: str = "obligations, compensation, termination, and liability"


@app.post("/compare")
async def compare(req: CompareRequest):
    _require_doc(req.doc_id_a)
    _require_doc(req.doc_id_b)
    result = ch.compare_docs(req.doc_id_a, req.doc_id_b, req.aspect)
    return result


# ── Docs list ─────────────────────────────────────────────────────────────────
@app.get("/docs-list")
async def docs_list():
    return {"documents": list(_doc_registry.values())}


# ── Session reset ─────────────────────────────────────────────────────────────
@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    import memory as mem
    mem.clear_session(session_id)
    return {"cleared": session_id}


# ── Helpers ───────────────────────────────────────────────────────────────────
def _require_doc(doc_id: str):
    if doc_id not in _doc_registry:
        # Try loading from disk (persisted index)
        store = vs.load_index(doc_id)
        if store is None:
            raise HTTPException(404, f"Document {doc_id!r} not found. Please ingest it first.")
        _doc_registry[doc_id] = {"doc_id": doc_id, "filename": "unknown", "num_chunks": 0, "num_pages": 0}


def _get_chunks(doc_id: str) -> list:
    """Re-load chunks from the FAISS index for bulk operations."""
    store = vs.load_index(doc_id)
    if store is None:
        return []
    # Retrieve a broad set of chunks for risk/worry analysis
    from langchain_core.documents import Document
    results = store.similarity_search("contract agreement terms obligations", k=40)
    return results

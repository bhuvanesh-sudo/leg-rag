# legal-rag

A modular retrieval-augmented generation system for legal document Q&A, built on LangChain, FAISS, HuggingFace embeddings, and Groq-hosted Llama 3.

---

## Architecture

```
PDF(s)
  └── ingestion.py       PyMuPDF text extraction
        └── RecursiveCharacterTextSplitter (chunk_size=500, overlap=50)
              └── vectorstore.py     FAISS + all-MiniLM-L6-v2 embeddings
                    └── retriever.py   top-k=4 similarity search
                          └── chain.py   RetrievalQA (stuff chain)
                                └── llm.py   GroqLLM → llama-3.1-8b-instant
                                      └── app.py   CLI loop
```

---

## Setup

```bash
pip install langchain langchain-community langchain-huggingface langchain-text-splitters \
            faiss-cpu pymupdf sentence-transformers requests python-dotenv
```

Create a `.env` file in `model/`:

```
API_KEY=your_groq_api_key
```

Place your source PDFs in `datasets/`, then:

```bash
cd model
python app.py
```

Type your query at the `>>` prompt. Enter `exit` to quit.

---

## Project structure

```
model/
├── app.py          CLI entrypoint
├── chain.py        RetrievalQA assembly
├── llm.py          Custom Groq LLM wrapper (BaseChatModel)
├── retriever.py    FAISS retriever config
├── vectorstore.py  Embedding + index construction
├── ingestion.py    PDF loading and text splitting
└── datasets/       (To be added)
```

---

## Roadmap

### Phase 1 — Ingestion and indexing

**Goal:** Support multiple documents, persistent indexes, and structure-aware chunking.

- [ ] Accept a directory of PDFs, not a single hardcoded file
- [ ] Save and load FAISS index to disk (`vectorstore.save_local` / `load_local`) so the index is built once, not on every run
- [ ] Add metadata (filename, page number, section) to each chunk for downstream citation
- [ ] Explore structure-aware splitting — legal docs have clauses, sections, and schedules that flat character splitting destroys. Candidates: `MarkdownHeaderTextSplitter` after extracting headings, or a custom regex-based clause splitter

### Phase 2 — Retrieval quality

**Goal:** Return the right chunks more reliably.

- [ ] Evaluate whether `all-MiniLM-L6-v2` is sufficient, or whether a legal-domain model (`legal-bert`, `nlpaueb/legal-bert-base-uncased`) improves precision
- [ ] Add **MMR** (maximal marginal relevance) retrieval to reduce redundant chunks in the context window
- [ ] Add **score threshold filtering** — reject chunks below a similarity threshold rather than always returning k=4
- [ ] Prototype **hybrid retrieval**: combine BM25 (keyword) with FAISS (semantic) via `EnsembleRetriever` for queries with specific legal terms, case names, or statute numbers

### Phase 3 — Generation quality

**Goal:** Answers that are grounded, cited, and appropriately cautious.

- [ ] Write a custom prompt template with:
  - Explicit instruction to answer only from the provided context
  - Jurisdiction / document scope framing
  - A standard legal disclaimer ("not a substitute for professional legal advice")
  - Citation instruction ("cite the relevant section or page")
- [ ] Enable `return_source_documents=True` and surface chunk provenance in the CLI output (already scaffolded in `app.py`, just uncommented)
- [ ] Experiment with `map_reduce` or `map_rerank` chain types for longer documents where stuffing all chunks into one prompt is too noisy

### Phase 4 — Evaluation

**Goal:** Know whether the system is actually getting better.

- [ ] Build a small golden Q&A dataset (20–50 question/answer/source triples) from the target documents
- [ ] Add RAGAS or a custom eval script measuring: answer faithfulness, answer relevance, context recall
- [ ] Track retrieval hit rate — how often does the correct chunk appear in the top-k results?
- [ ] Use eval results to drive chunking and retrieval decisions rather than gut feel

### Phase 5 — Interface and deployment (future)

- [ ] FastAPI wrapper around `qa_chain` so it can serve a frontend or be called by other tools
- [ ] Simple web UI (Streamlit or plain HTML) with source highlighting
- [ ] Multi-turn conversation with memory (follow-up questions that reference prior context)
- [ ] Role-specific modes: contract review, case law search, statute lookup

---

## Known limitations (current state)

| Issue | Impact | Fix (see roadmap) |
|---|---|---|
| Vector store rebuilt on every run | Slow startup; impractical for large corpora | Phase 1: FAISS persistence |
| Single hardcoded PDF | Can't scale to a real document corpus | Phase 1: directory ingestion |
| Generic chunking | Clause boundaries destroyed | Phase 1: structure-aware splitting |
| No custom prompt | No legal framing, disclaimers, or citation instruction | Phase 3: prompt template |
| No source display | User can't verify where an answer came from | Phase 3: uncomment source output |
| No evaluation | No way to know if changes help | Phase 4: eval harness |

---

# LegalLens

A full-stack, modular retrieval-augmented generation system for "Contract Intelligence." It transforms complex legal PDFs into plain-English insights using clause-aware chunking, FAISS persistence, and Groq-hosted Llama 3.3.

---

## Architecture

```
PDF(s)
  └── ingestion.py       PyMuPDF extraction + Heading detection
        └── chunker.py         Clause-aware splitting (preserving section boundaries)
              └── vectorstore.py     FAISS Persistence (save_local / load_local)
                    └── retriever.py   Semantic search + Cross-encoder reranking
                          └── chain.py       FastAPI + LangChain reasoning
                                └── prompts.py     Legal-framed templates (QA, Risk, Compare)
                                      └── App.jsx        React (Vite) High-contrast UI
```

---

## Setup

### 1. Backend (FastAPI)
```bash
cd model
pip install -r requirements.txt

# Create .env
echo "API_KEY=your_groq_api_key" > .env

# Start the API server
uvicorn api:app --reload --port 8000
```

### 2. Frontend (React)
```bash
cd legallens
npm install
npm run dev
```

---

## Project Structure

```
.
├── model/                  # Backend Engine
│   ├── api.py              # FastAPI endpoints
│   ├── ingestion.py        # PDF parsing with structure awareness
│   ├── chunker.py          # Regex-based clause/section splitting
│   ├── vectorstore.py      # FAISS index management & persistence
│   ├── risk.py             # Severity-based clause classifier
│   └── prompts.py          # Legal disclaimers & persona framing
└── src/                    # Frontend (React)
    ├── components/         # Modular UI (Cards, Chat, Upload)
    ├── styles/             # Theme & Global CSS
    └── App.jsx             # Main Application Logic
```

---

## Features

| Mode | Capability |
| :--- | :--- |
| **Q&A** | Plain-English answers with clause-level citations and source excerpts. |
| **Risk Scan** | Auto-detects 10+ risky clause types (Indemnity, Termination) with severity levels. |
| **Worry List** | A prioritized executive summary of top concerns and negotiation points. |
| **Compare** | Semantic diffing between two contract versions to identify "sneaky" changes. |

---

## Roadmap

### Phase 1 — Ingestion and Indexing (Complete)
- [x] Clause-aware splitting (regex-based section detection)
- [x] FAISS persistence (index saves to `./indexes` to avoid re-parsing)
- [x] Multi-document support via session-based retrieval

### Phase 2 — Intelligence (Current)
- [x] **Risk Classifier:** Severity tagging (High/Medium/Low) for harmful clauses
- [x] **Cross-Encoder Reranking:** Validates top-k results for higher precision
- [x] **Semantic Diffing:** Logic to compare "Version A" vs "Version B"

### Phase 3 — Refinement (Planned)
- [ ] **Hybrid Search:** Combine BM25 keyword matching with semantic vector search
- [ ] **Structure Mapping:** Use Neo4j to map relationships between schedules and master clauses
- [ ] **Agentic Review:** Implement a "Critique" step where a second LLM pass looks for hallucinations

---

## Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `API_KEY` | `required` | Your Groq API key (Llama-3.3-70b-versatile) |
| `INDEX_DIR` | `./indexes` | Where FAISS indexes are persisted |
| `UPLOAD_DIR` | `./uploads` | Storage for processed PDFs |

---

## Known Limitations

- **Educational Use Only:** LegalLens is a tool for reading assistance; it is not a substitute for professional legal advice.
- **OCR:** Currently relies on digital text layers; scanned (image-only) PDFs require a pre-processing OCR step.
- **Context Window:** Extremely large contracts (100+ pages) may require `map_reduce` strategies for the "Worry List" generation.
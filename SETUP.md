# LegalLens — Setup & Run

## Prerequisites
- Python 3.10+
- Node.js 18+ (for the React frontend)
- A Groq API key (free at console.groq.com)

---

## 1. Backend setup

```bash
cd model/
pip install -r ../requirements.txt

# Create .env
echo "API_KEY=your_groq_key_here" > .env

# Start the API server
uvicorn api:app --reload --port 8000
```

The API will be available at http://localhost:8000
Interactive docs at http://localhost:8000/docs

---

## 2. Frontend setup

```bash
# In your React project (Vite recommended)
npm create vite@latest legallens -- --template react
cd legallens
npm install

# Replace src/App.jsx with the provided App.jsx
cp ../App.jsx src/App.jsx

# Remove src/App.css and src/index.css imports if they cause conflicts
# Start the dev server
npm run dev
```

Open http://localhost:5173

---

## 3. Usage

1. Upload a PDF contract via the sidebar or the landing drop zone
2. The system indexes the document (clause-aware chunking + FAISS)
3. Use **Q&A** mode to ask plain-English questions
4. Use **Risk Scan** to auto-detect risky clauses
5. Use **Worry List** for a prioritized concerns summary
6. Use **Compare** to diff two contract versions (upload Version B in the sidebar)

---

## Environment variables

| Variable    | Default       | Description                        |
|-------------|---------------|------------------------------------|
| API_KEY     | required      | Your Groq API key                  |
| INDEX_DIR   | ./indexes     | Where FAISS indexes are persisted  |
| UPLOAD_DIR  | ./uploads     | Where uploaded PDFs are saved      |

---

## Architecture

```
model/
├── ingestion.py   PyMuPDF extraction with heading/clause detection
├── chunker.py     Clause-aware chunking preserving section boundaries
├── vectorstore.py FAISS with persistence (load_local / save_local)
├── retriever.py   Semantic retrieval + cross-encoder reranking
├── llm.py         Groq LLM wrapper (llama-3.3-70b-versatile)
├── prompts.py     All prompt templates (QA, risk, worry, compare, chat)
├── risk.py        Regex-based risk classifier (10 clause types)
├── memory.py      Per-session conversation memory
├── chain.py       Core reasoning chains
└── api.py         FastAPI serving all endpoints
```

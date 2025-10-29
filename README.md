# Med-Concise — 24‑Hour Hackathon Build

Turn PubMed searches into concise, structured medical summaries using a local LLM via Ollama. Built in 24 hours to showcase fast, private, and auditable literature triage.

## Why
Clinicians and researchers waste time sifting abstracts. Med-Concise fetches relevant PubMed papers and produces short, structured summaries with confidence scores.

## What (Key Features)
- PubMed retrieval for a query (top N papers)
- Chunked LLM summarization with fallback extractive logic
- Structured JSON output: key_findings, methodology, conclusion
- Confidence scoring (LLM vs fallback)
- Local inference via Ollama (privacy-friendly)

## Architecture (Quick)
- Backend (Python) with:
  - services/pubmed_service.py → fetch PubMed abstracts
  - services/langchain_summarizer.py → chunk + summarize via Ollama, with safe fallback
  - controllers/summarization_controller.py → orchestrate search → summarize → return JSON
- Ollama model server (local)
- Env-configurable model and ports

## Quickstart

### Prerequisites
- Windows 10/11
- Python 3.10+
- Git
- Ollama running locally: https://ollama.ai (then pull a model, e.g. `ollama pull llama3.1`)

### Setup
```powershell
# clone
git clone https://github.com/<your-username>/<your-repo>.git
cd med-concise-main

# create environment file
# DO NOT COMMIT REAL KEYS
# backend/env.local is already gitignored
```

Create file backend/env.local:
```env
PUBMED_API_KEY=your_pubmed_api_key
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1
BACKEND_PORT=8000
```

Install Python deps (example):
```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r backend/requirements.txt
```

Start Ollama and pull a model:
```powershell
ollama serve
ollama pull llama3.1
```

Run the backend (choose what matches your app entrypoint):
```powershell
# If FastAPI with Uvicorn (adjust module if different)
uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload

# Or run a script/module if provided
python -m backend
```

### Programmatic Use (quick demo)
```python
from backend.controllers.summarization_controller import process_query

result = process_query("type 2 diabetes GLP-1 cardiovascular outcomes", num_papers=5)
print(result["total_processed"], "papers")
print(result["papers"][0]["summary"])
```

## API (if exposed)
- POST /api/summarize (example): { "query": "your topic", "num_papers": 5 }
- Returns: { success, query, timestamp, papers: [{ metadata..., summary, confidence_score }], total_processed }

## Hackathon Constraints
- Built in 24 hours; emphasis on working demo, stability, and privacy (local LLM)
- Fallback extractive summarizer guarantees output even if the model fails

## Limitations
- Abstract-only (no full-text)
- Not a clinical decision tool
- Model output may contain errors; citations recommended for verification

## Future Enhancements
- Full RAG (embeddings + vector store + semantic retriever)
- Provenance: sentence-level citations per bullet
- Better evaluation and CI for factuality/regression
- Caching and batching for throughput
- Simple UI and multi-model selection

## Development
- Secrets in backend/env.local (gitignored)
- Common ignores set in .gitignore (venv, node_modules, logs, cache)
- Windows-friendly commands included

## License
MIT (or your choice)

## Acknowledgments
- PubMed/NCBI APIs
- LangChain, Ollama, and open-source model communities

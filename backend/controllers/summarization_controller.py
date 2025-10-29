from typing import Dict, Any
from datetime import datetime, timezone

from ..services.pubmed_service import PubMedService
from ..services.langchain_summarizer import summarize_abstract


def process_query(query: str, num_papers: int = 5) -> Dict[str, Any]:
    service = PubMedService()
    papers = service.search(query, num_papers)

    results = []
    for p in papers:
        try:
            s = summarize_abstract(p.get("abstract", ""))
            results.append({
                "paper_id": p.get("paper_id"),
                "title": p.get("title"),
                "abstract": p.get("abstract"),
                "authors": p.get("authors"),
                "pub_date": p.get("publication_date"),
                "doi_link": p.get("doi_link"),
                "summary": s["summary"],
                "confidence_score": s["confidence_score"],
            })
        except Exception:
            # Skip failed summaries but include metadata
            results.append({
                "paper_id": p.get("paper_id"),
                "title": p.get("title"),
                "abstract": p.get("abstract"),
                "authors": p.get("authors"),
                "pub_date": p.get("publication_date"),
                "doi_link": p.get("doi_link"),
                "summary": {"key_findings": [], "methodology": "", "conclusion": ""},
                "confidence_score": 0.0,
            })

    now_iso = datetime.now(timezone.utc).isoformat()
    return {
        "success": True,
        "query": query,
        "timestamp": now_iso,
        "papers": results,
        "total_processed": len(results),
    }

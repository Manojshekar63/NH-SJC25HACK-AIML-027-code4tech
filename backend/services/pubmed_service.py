import os
import time
import hashlib
from typing import Any, Dict, List, Optional
import requests
from cachetools import TTLCache

NCBI_API_KEY = os.getenv("PUBMED_API_KEY", "")
EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

# Cache results for 24 hours
_cache = TTLCache(maxsize=256, ttl=60 * 60 * 24)
# Simple rate limit: 3 req/sec => sleep to enforce
_LAST_CALL_TS = 0.0
_MIN_INTERVAL = 1.0 / 3.0


def _ratelimit():
    global _LAST_CALL_TS
    now = time.time()
    elapsed = now - _LAST_CALL_TS
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)
    _LAST_CALL_TS = time.time()


class PubMedService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or NCBI_API_KEY

    def _cache_key(self, query: str, num_papers: int) -> str:
        raw = f"{query}:{num_papers}:{self.api_key}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def search(self, query: str, num_papers: int = 5) -> List[Dict[str, Any]]:
        if not query or not query.strip():
            raise ValueError("Query must be a non-empty string.")
        num_papers = max(1, min(10, int(num_papers)))

        key = self._cache_key(query.strip(), num_papers)
        if key in _cache:
            return _cache[key]

        ids = self._esearch(query, num_papers)
        papers = self._esummary_and_efetch(ids)
        _cache[key] = papers
        return papers

    def _esearch(self, query: str, num_papers: int) -> List[str]:
        params = {
            "db": "pubmed",
            "term": query,
            "retmax": num_papers,
            "sort": "relevance",
        }
        if self.api_key:
            params["api_key"] = self.api_key

        _ratelimit()
        resp = requests.get(f"{EUTILS_BASE}/esearch.fcgi", params=params, timeout=15)
        resp.raise_for_status()
        from xml.etree import ElementTree as ET
        root = ET.fromstring(resp.text)
        idlist = root.find("IdList")
        ids = [elem.text for elem in (idlist or []) if elem is not None and elem.text]
        return ids

    def _esummary_and_efetch(self, ids: List[str]) -> List[Dict[str, Any]]:
        if not ids:
            return []
        id_str = ",".join(ids)
        params_sum = {"db": "pubmed", "id": id_str, "retmode": "json"}
        if self.api_key:
            params_sum["api_key"] = self.api_key

        _ratelimit()
        s_resp = requests.get(f"{EUTILS_BASE}/esummary.fcgi", params=params_sum, timeout=15)
        s_resp.raise_for_status()
        s_data = s_resp.json()
        result_docs = s_data.get("result", {})

        # Fetch abstracts
        params_fetch = {"db": "pubmed", "id": id_str, "rettype": "abstract", "retmode": "xml"}
        if self.api_key:
            params_fetch["api_key"] = self.api_key
        _ratelimit()
        f_resp = requests.get(f"{EUTILS_BASE}/efetch.fcgi", params=params_fetch, timeout=20)
        f_resp.raise_for_status()
        from xml.etree import ElementTree as ET
        f_root = ET.fromstring(f_resp.text)
        pmid_to_abstract: Dict[str, str] = {}
        for art in f_root.findall(".//PubmedArticle"):
            pmid_elem = art.find(".//PMID")
            abstract_text_elems = art.findall(".//Abstract/AbstractText")
            pmid = pmid_elem.text if pmid_elem is not None else None
            if pmid:
                abstract_text = "\n".join([(e.text or "").strip() for e in abstract_text_elems])
                pmid_to_abstract[pmid] = abstract_text

        papers: List[Dict[str, Any]] = []
        for pid in ids:
            doc = result_docs.get(pid, {})
            authors = [a.get("name") for a in doc.get("authors", []) if a.get("name")]
            doi = None
            for iden in doc.get("articleids", []):
                if iden.get("idtype") == "doi":
                    doi = iden.get("value")
                    break
            papers.append({
                "paper_id": pid,
                "title": doc.get("title"),
                "abstract": pmid_to_abstract.get(pid, ""),
                "authors": authors,
                "publication_date": doc.get("pubdate"),
                "doi_link": f"https://doi.org/{doi}" if doi else None,
            })
        return papers

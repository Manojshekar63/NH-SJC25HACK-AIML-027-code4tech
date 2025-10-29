import os
import time
import json
import re
from typing import Dict, Any, List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain_community.llms import Ollama

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

prompt_template = PromptTemplate.from_template(
    """
You are a medical research summarization assistant.
Given an abstract chunk, produce a concise structured summary with:
- Key findings (3-6 bullets)
- Methodology (1-2 sentences)
- Conclusion (1-2 sentences)

Return ONLY valid JSON and nothing else with the keys exactly:
key_findings (array of strings), methodology (string), conclusion (string).

Abstract chunk:
{chunk}
"""
)


def ensure_ollama_running() -> bool:
    import requests
    try:
        r = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=5)
        return r.ok
    except Exception:
        return False


def _extract_json(text: str) -> Dict[str, Any]:
    # Try direct parse
    try:
        return json.loads(text)
    except Exception:
        pass
    # Try to find the first JSON object
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    return {}


# ---- Fallback summarizer (extractive, no external deps) ----
_SENT_SPLIT = re.compile(r"(?<=[.!?])\s+")


def _split_sentences(text: str) -> List[str]:
    parts = _SENT_SPLIT.split(text.strip()) if text else []
    # Clean and filter very short fragments
    return [s.strip() for s in parts if len(s.strip()) > 30]


def _select_key_findings(sentences: List[str], max_items: int = 6) -> List[str]:
    if not sentences:
        return []
    # Simple scoring: prefer sentences with quantitative signals or medical keywords
    keywords = [
        "randomized", "double-blind", "cohort", "meta-analysis", "significant",
        "%", "p=", "p <", "hazard ratio", "odds ratio", "risk", "confidence interval",
        "reduction", "increase", "improved", "benefit", "adverse", "safety",
    ]
    def score(s: str) -> int:
        base = 0
        for kw in keywords:
            if kw.lower() in s.lower():
                base += 2
        # Slightly prefer medium length
        length_bonus = 1 if 80 <= len(s) <= 240 else 0
        return base + length_bonus
    ranked = sorted(sentences, key=score, reverse=True)
    # Ensure diversity by picking from different regions
    picks: List[str] = []
    used_idx: set[int] = set()
    for cand in ranked:
        for i, s in enumerate(sentences):
            if s == cand and i not in used_idx:
                picks.append(cand)
                used_idx.add(i)
                break
        if len(picks) >= max_items:
            break
    if not picks:
        # Fallback to first few sentences
        picks = sentences[:max_items]
    return picks


def _infer_methodology(sentences: List[str]) -> str:
    if not sentences:
        return ""
    method_cues = ["method", "randomized", "trial", "cohort", "retrospective", "prospective", "meta-analysis", "systematic review"]
    for s in sentences[:6]:
        if any(cue in s.lower() for cue in method_cues):
            return s
    return sentences[0]


def _infer_conclusion(sentences: List[str]) -> str:
    if not sentences:
        return ""
    concl_cues = ["conclude", "conclusion", "suggest", "support", "recommend", "implication"]
    for s in reversed(sentences[-6:]):
        if any(cue in s.lower() for cue in concl_cues):
            return s
    # Otherwise take last sentence
    return sentences[-1]


def _fallback_extractive_summary(abstract: str) -> Dict[str, Any]:
    sentences = _split_sentences(abstract)
    key_findings = _select_key_findings(sentences, max_items=6)
    methodology = _infer_methodology(sentences)
    conclusion = _infer_conclusion(sentences)
    return {
        "key_findings": key_findings[:6],
        "methodology": methodology or "",
        "conclusion": conclusion or "",
    }


def summarize_abstract(abstract: str, timeout_seconds: int = 45) -> Dict[str, Any]:
    if not abstract:
        return {"summary": {"key_findings": [], "methodology": "", "conclusion": ""}, "confidence_score": 0.0}

    # Try LLM path if available
    used_fallback = False
    merged: Dict[str, Any] = {"key_findings": [], "methodology": "", "conclusion": ""}

    if ensure_ollama_running():
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500, chunk_overlap=150, separators=["\n\n", "\n", ". ", " "]
        )
        chunks = splitter.split_text(abstract)
        if chunks:
            llm = Ollama(model=OLLAMA_MODEL, base_url=OLLAMA_HOST, temperature=0)
            start_time = time.time()
            partial_summaries: List[Dict[str, Any]] = []
            for chunk in chunks:
                if time.time() - start_time > timeout_seconds:
                    break
                try:
                    prompt = prompt_template.format(chunk=chunk)
                    raw = llm.invoke(prompt)
                    parsed = _extract_json(raw)
                    if not parsed:
                        parsed = _fallback_extractive_summary(chunk)
                    # Normalize
                    kf = parsed.get("key_findings") or []
                    if isinstance(kf, str):
                        kf = [kf]
                    parsed["key_findings"] = [s for s in kf if isinstance(s, str) and s.strip()]
                    parsed["methodology"] = (parsed.get("methodology") or "").strip()
                    parsed["conclusion"] = (parsed.get("conclusion") or "").strip()
                    partial_summaries.append(parsed)
                except Exception:
                    used_fallback = True
                    partial_summaries.append(_fallback_extractive_summary(chunk))
            # Merge
            for p in partial_summaries:
                merged["key_findings"].extend(p.get("key_findings", []))
                if p.get("methodology"):
                    merged["methodology"] += ("\n" if merged["methodology"] else "") + p["methodology"]
                if p.get("conclusion"):
                    merged["conclusion"] += ("\n" if merged["conclusion"] else "") + p["conclusion"]
        else:
            used_fallback = True
            merged = _fallback_extractive_summary(abstract)
    else:
        used_fallback = True
        merged = _fallback_extractive_summary(abstract)

    # Trim for UI
    if isinstance(merged, dict) and "key_findings" in merged:
        if isinstance(merged["key_findings"], list):
            merged["key_findings"] = merged["key_findings"][:6]

    confidence = 0.9 if not used_fallback else 0.6
    return {"summary": merged, "confidence_score": confidence}

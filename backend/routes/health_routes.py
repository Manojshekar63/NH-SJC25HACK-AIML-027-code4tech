from fastapi import APIRouter
import requests
import os

router = APIRouter()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

@router.get("/ollama")
def health_ollama():
    available_models = []
    ollama_status = "disconnected"
    try:
        resp = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=5)
        if resp.ok:
            data = resp.json()
            available_models = [m.get("name") for m in data.get("models", []) if m.get("name")]
            ollama_status = "connected"
    except Exception:
        ollama_status = "disconnected"
    return {
        "ollama_status": ollama_status,
        "model": MODEL,
        "available_models": available_models,
        "backend_status": "operational",
    }

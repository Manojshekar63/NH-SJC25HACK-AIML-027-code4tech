from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .routes.summarize_routes import router as summarize_router
from .routes.health_routes import router as health_router

# Load default .env and optional backend/env.local
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "env.local"), override=True)

app = FastAPI(title="MedLit AI Summarizer", version="1.0.0")

# CORS: allow local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/health", tags=["health"]) 
app.include_router(summarize_router, prefix="/api/summarize", tags=["summarize"]) 

@app.get("/")
def root():
    return {"service": "MedLit AI Summarizer Backend", "status": "ok"}

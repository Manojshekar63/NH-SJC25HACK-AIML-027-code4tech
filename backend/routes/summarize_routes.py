from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from ..controllers.summarization_controller import process_query

router = APIRouter()

class SummarizeRequest(BaseModel):
    query: str = Field(..., min_length=2)
    num_papers: Optional[int] = Field(default=5, ge=1, le=10)

@router.post("/search")
def summarize_search(payload: SummarizeRequest):
    try:
        result = process_query(payload.query, payload.num_papers or 5)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as ex:
        raise HTTPException(status_code=500, detail="Internal server error")

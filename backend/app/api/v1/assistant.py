from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.assistant.agent import TourismAIAgent

router = APIRouter()

class ChatRequest(BaseModel):
    message: str = Field(..., example="Plan a 4-day trip to Himachal Pradesh for adventure and mountains")
    context: Optional[Dict[str, Any]] = None

@router.post("/chat")
def chat_with_assistant(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Controlled Agentic AI travel assistant endpoint with RAG tool execution and fallback.
    """
    agent = TourismAIAgent(db)
    result = agent.process_message(message=req.message, context=req.context)
    return result

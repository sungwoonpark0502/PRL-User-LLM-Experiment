from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.core.llm_service import get_llm_response, LLMServiceError
from app.core.config import LLM_MAPPING

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    nickname: str
    messages: List[Message]

class ChatResponse(BaseModel):
    response: str
    error: str = None

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle chat requests to different LLM providers."""
    try:
        # Validate nickname
        if request.nickname.lower() not in LLM_MAPPING:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid nickname. Must be one of: {', '.join(LLM_MAPPING.keys())}"
            )
        
        # Convert messages to list of dicts
        messages = [msg.dict() for msg in request.messages]
        
        # Get response from appropriate LLM
        response = await get_llm_response(request.nickname, messages)
        
        return ChatResponse(response=response)
        
    except LLMServiceError as e:
        # Handle known LLM service errors
        return ChatResponse(
            response="I apologize, but I encountered an error.",
            error=str(e)
        )
    except Exception as e:
        # Handle unexpected errors
        print(f"Unexpected error in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing your request."
        ) 
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import os

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# LLM mapping dictionary
llm_map = {
    "Sarah": {"provider": "openai", "model": "gpt-4", "key_env": "OPENAI_API_KEY"},
    "Peter": {"provider": "openai", "model": "gpt-3.5-turbo", "key_env": "OPENAI_API_KEY"},
    "James": {"provider": "meta", "model": "meta-llama/Llama-3-70b-chat-hf", "key_env": "HF_API_KEY"},
    "Emily": {"provider": "google", "model": "gemini-1.5-pro", "key_env": "GEMINI_API_KEY"},
}

# Define input schema
class ChatRequest(BaseModel):
    nickname: str
    message: str

@app.post("/api/chat")
async def chat(request: ChatRequest):
    # Get LLM info from nickname
    llm_info = llm_map.get(request.nickname)
    if not llm_info:
        raise HTTPException(status_code=400, detail=f"Unknown LLM nickname: {request.nickname}")

    # Get API key from environment
    api_key = os.getenv(llm_info["key_env"])
    if not api_key:
        raise HTTPException(status_code=400, detail=f"API Key not configured for nickname: {request.nickname}")

    try:
        if llm_info["provider"] == "openai":
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model=llm_info["model"],
                messages=[{"role": "user", "content": request.message}]
            )
            return {"reply": response.choices[0].message.content}
        else:
            # For now, return a message for other providers
            return {"reply": f"Provider {llm_info['provider']} not implemented yet"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add CORS middleware
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

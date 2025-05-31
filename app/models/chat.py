from pydantic import BaseModel

class ChatRequest(BaseModel):
    nickname: str
    message: str

class ChatResponse(BaseModel):
    reply: str 
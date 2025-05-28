from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import os

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Set up OpenAI client using API key from .env
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Define input schema: expects a JSON with a 'prompt' field
class ChatRequest(BaseModel):
    prompt: str

# Define the /chat/openai endpoint
@app.post("/chat/openai")
async def chat_openai(request: ChatRequest):
    try:
        # Sends prompt to GPT-3.5 and gets response
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": request.prompt}]
        )
        # return the assistant's reply
        return {"response": response.choices[0].message.content}
    except Exception as e:
         # something went wrong so throw a 500 with the error message
        raise HTTPException(status_code=500, detail=str(e))

import httpx
from typing import Dict, Any, Optional
from ..core.config import API_KEYS, API_ENDPOINTS, MODEL_SETTINGS, LLM_MAPPING

class LLMServiceError(Exception):
    """Base exception for LLM service errors."""
    pass

class MissingAPIKeyError(LLMServiceError):
    """Raised when an API key is missing."""
    pass

class APIError(LLMServiceError):
    """Raised when an API request fails."""
    pass

async def get_openai_response(messages: list, model: str = "gpt-4-turbo-preview") -> str:
    """Get response from OpenAI API."""
    if not API_KEYS["openai"]:
        raise MissingAPIKeyError("OpenAI API key is not set. Please add OPENAI_API_KEY to your .env file.")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                API_ENDPOINTS["openai"],
                headers={"Authorization": f"Bearer {API_KEYS['openai']}"},
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": MODEL_SETTINGS["openai"]["temperature"],
                    "max_tokens": MODEL_SETTINGS["openai"]["max_tokens"]
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
    except httpx.HTTPError as e:
        raise APIError(f"OpenAI API request failed: {str(e)}")

async def get_meta_response(messages: list) -> str:
    """Get response from Meta's LLaMA model via Hugging Face."""
    if not API_KEYS["meta"]:
        raise MissingAPIKeyError("Hugging Face API key is not set. Please add HF_API_KEY to your .env file.")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                API_ENDPOINTS["meta"],
                headers={"Authorization": f"Bearer {API_KEYS['meta']}"},
                json={
                    "inputs": messages[-1]["content"],
                    "parameters": {
                        "temperature": MODEL_SETTINGS["meta"]["temperature"],
                        "max_new_tokens": MODEL_SETTINGS["meta"]["max_tokens"]
                    }
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()[0]["generated_text"]
    except httpx.HTTPError as e:
        raise APIError(f"Meta API request failed: {str(e)}")

async def get_google_response(messages: list) -> str:
    """Get response from Google's Gemini model."""
    if not API_KEYS["google"]:
        raise MissingAPIKeyError("Google API key is not set. Please add GOOGLE_API_KEY to your .env file.")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                API_ENDPOINTS["google"],
                headers={"Authorization": f"Bearer {API_KEYS['google']}"},
                json={
                    "model": MODEL_SETTINGS["google"]["model"],
                    "messages": messages,
                    "temperature": MODEL_SETTINGS["google"]["temperature"],
                    "max_tokens": MODEL_SETTINGS["google"]["max_tokens"]
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()["candidates"][0]["content"]["parts"][0]["text"]
    except httpx.HTTPError as e:
        raise APIError(f"Google API request failed: {str(e)}")

async def get_llm_response(nickname: str, messages: list) -> str:
    """Get response from the appropriate LLM provider based on nickname."""
    try:
        provider = LLM_MAPPING.get(nickname.lower())
        if not provider:
            raise ValueError(f"Unknown LLM nickname: {nickname}")
        
        if provider == "openai":
            model = "gpt-4-turbo-preview" if nickname.lower() == "sarah" else "gpt-3.5-turbo"
            return await get_openai_response(messages, model)
        elif provider == "meta":
            return await get_meta_response(messages)
        elif provider == "google":
            return await get_google_response(messages)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
            
    except MissingAPIKeyError as e:
        print(f"Error: {str(e)}")
        return f"I apologize, but I'm currently unable to respond because {str(e)}"
    except APIError as e:
        print(f"Error: {str(e)}")
        return "I apologize, but I'm having trouble connecting to my language model. Please try again later."
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return "I apologize, but I encountered an unexpected error. Please try again later." 
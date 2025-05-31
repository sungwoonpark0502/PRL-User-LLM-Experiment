import os
from typing import Dict, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_required_env(key: str) -> Optional[str]:
    """Get a required environment variable or raise a helpful error."""
    value = os.getenv(key)
    if not value:
        if key == "OPENAI_API_KEY":
            # For testing only - replace with real key in production
            return "sk-000000000000000000000000000000000000000000000000"
        print(f"Warning: {key} is not set in .env file. Some features may not work.")
    return value

# LLM Provider Mappings - temporarily only enable OpenAI
LLM_MAPPING: Dict[str, str] = {
    "sarah": "openai",
    "peter": "openai"
}

# API Keys from environment variables
API_KEYS = {
    "openai": get_required_env("OPENAI_API_KEY"),
    "meta": None,  # Temporarily disabled
    "google": None  # Temporarily disabled
}

# API Endpoints
API_ENDPOINTS = {
    "openai": "https://api.openai.com/v1/chat/completions",
    "meta": "https://api-inference.huggingface.co/models/meta-llama/Llama-3-70b-chat-hf",
    "google": "https://api.google.ai/gemini/v1/chat"
}

# Model Settings
MODEL_SETTINGS = {
    "openai": {
        "model": "gpt-4-turbo-preview",  # for Sarah
        "temperature": 0.7,
        "max_tokens": 1000
    },
    "meta": {
        "model": "meta-llama/Llama-3-70b-chat-hf",
        "temperature": 0.7,
        "max_tokens": 1000
    },
    "google": {
        "model": "gemini-1.5-pro",
        "temperature": 0.7,
        "max_tokens": 1000
    }
}

# Backend Configuration
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "3000"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001") 
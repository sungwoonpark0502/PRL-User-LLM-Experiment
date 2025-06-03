import requests
import os
import sys

name_to_model = {
    "Peter": ("llama3", "ollama"),
    "Sarah": ("mistral", "ollama"),
    "James": ("gemma", "ollama"),
    "Alex": ("gpt-4o", "openai") 
}

OLLAMA_API_URL = "http://localhost:11434/api/generate"
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY") 
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  

def chat(name, prompt):
    model_info = name_to_model.get(name)
    if not model_info:
        return {"error": f"No model for {name}"}

    model_id, provider = model_info

    if provider == "ollama":
        headers = {}
        if OLLAMA_API_KEY:
            headers = {
                "Authorization": f"{OLLAMA_API_KEY}", 
                "Content-Type": "application/json"
            }
            

        payload = {
            "model": model_id,
            "prompt": prompt,
            "stream": False
        }

        try:
            response = requests.post(OLLAMA_API_URL, json=payload, headers=headers)
            response.raise_for_status()
            return {"response": response.json().get("response", "")}
        except Exception as e:
            return {"error": str(e)}

    elif provider == "openai":
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model_id,
            "messages": [{"role": "user", "content": prompt}]
        }

        try:
            response = requests.post(OPENAI_API_URL, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return {"response": data["choices"][0]["message"]["content"]}
        except Exception as e:
            return {"error": str(e)}

    else:
        return {"error": f"Unknown provider: {provider}"}
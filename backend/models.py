import requests
import os

name_to_model = {
    "Peter": "llama3",
    "Sophia": "mistral",
    "Alex": "gemma"
}

API_URL = "http://localhost:11434/api/generate"
API_KEY = os.getenv("OLLAMA_API_KEY") 

def chat(name, prompt):
    model_id = name_to_model.get(name)
    if not model_id:
        return {"error": f"No model for {name}"}

    headers = {}
    if API_KEY:
        headers["Authorization"] = f"{API_KEY}"

    payload = {
        "model": model_id,
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        response.raise_for_status()
        return {"response": response.json().get("response", "")}
    except Exception as e:
        return {"error": str(e)}

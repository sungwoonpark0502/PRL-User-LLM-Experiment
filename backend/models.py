import os
from openai import OpenAI
from dotenv import load_dotenv

name_to_model = {
    "Peter": ("llama3", "ollama"),
    "Sarah": ("mistral", "ollama"),
    "James": ("gemma", "ollama"),
    "Alex": ("gpt-4o", "openai") 
}
load_dotenv()

OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Missing OPENAI_API_KEY")

gpt_client = OpenAI(api_key=OPENAI_API_KEY)


gpt_client = OpenAI(api_key=OPENAI_API_KEY)

def chat(name, prompt):
    model_info = name_to_model.get(name)
    if not model_info:
        return {"error": f"No model for {name}"}

    model_id, provider = model_info

    if provider == "ollama":
        headers = {
            "Content-Type": "application/json"
        }
        if OLLAMA_API_KEY:
            headers["Authorization"] = f"{OLLAMA_API_KEY}"

        payload = {
            "model": model_id,
            "prompt": prompt,
            "stream": False
        }

        try:
            import requests
            response = requests.post(OLLAMA_API_URL, json=payload, headers=headers)
            response.raise_for_status()
            return {"response": response.json().get("response", "")}
        except Exception as e:
            return {"error": str(e)}

    elif provider == "openai":
        try:
            completion = gpt_client.chat.completions.create(
                model=model_id,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=256,
                top_p=1,
                n=1,
            )
            return {"response": completion.choices[0].message.content}
        except Exception as e:
            return {"error": str(e)}

    else:
        return {"error": f"Unknown provider: {provider}"}
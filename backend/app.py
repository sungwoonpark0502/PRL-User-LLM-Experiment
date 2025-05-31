from flask import Flask, request, jsonify
from flask_cors import CORS
from models import chat

app = Flask(__name__)
CORS(app)

@app.route("/api/models", methods=["GET"])
def get_models():
    return jsonify(["Peter", "Sophia", "Alex"])

@app.route("/api/chat", methods=["POST"])
def chat_endpoint():
    data = request.json
    name = data.get("name")
    prompt = data.get("prompt")

    if not name or not prompt:
        return jsonify({"error": "Missing 'name' or 'prompt'"}), 400

    result = chat(name, prompt)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)
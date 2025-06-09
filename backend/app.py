from flask import Flask, request, jsonify
from flask_cors import CORS
from models import chat
from routes import register_routes

app = Flask(__name__)
CORS(app)

register_routes(app)

@app.route("/api/models", methods=["GET"])
def get_models():
    return jsonify(["Peter", "Sarah", "James", "Alex"])

@app.route("/api/chat", methods=["POST"])
def chat_endpoint():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        return response
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data received"}), 400
            
        name = data.get("name")
        prompt = data.get("prompt")

        if not name or not prompt:
            return jsonify({"error": "Missing 'name' or 'prompt'"}), 400

        result = chat(name, prompt)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5055)
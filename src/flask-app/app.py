from flask import Flask, request, jsonify
from flask_cors import CORS
from trie import get_words

app = Flask(__name__)
CORS(app, origins="http://localhost:5000")

# Test API
@app.route('/api/test', methods=['GET'])
def test():
    if request.method == 'GET':
        data = request.json.get("data")
        return jsonify(data), 200
    else:
        return None
    
# API Route called from Next.js application
@app.route('/api/solve', methods=['GET'])
def solve():
    try:
        data = request.get_json()
        game = data.get("game")
        words = get_words(data.get("data", []), game)

        return jsonify({ "possible_words": words})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

if __name__ == "__main__":
    app.run(debug=True)
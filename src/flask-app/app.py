from flask import Flask, request, jsonify
from flask_cors import CORS
from solver import generate_anagram_words, generate_spelling_bee_words

app = Flask(__name__)
CORS(app, origins="http://localhost:5000")

# Test API
@app.route('/api/test', methods=['POST'])
def test():
    if request.method == 'POST':
        data = request.json.get("data")
        return jsonify(data), 200
    else:
        return None
    
# API Route called from Next.js application
@app.route('/api/solve', methods=['POST'])
def solve():
    try:
        data = request.get_json()
        game = data.get("game")
        letters = data.get("data", [])

        if game == "anagrams":
            words = generate_anagram_words(letters)
        else:
            words = generate_spelling_bee_words(letters, letters[0])

        return jsonify({ "possible_words": words })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

if __name__ == "__main__":
    app.run(debug=True)
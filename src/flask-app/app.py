from flask import Flask, request, jsonify
from flask_cors import CORS
from .solver import generate_anagram_words, generate_spelling_bee_words, generate_letter_loop_combinations, generate_quartiles_words, generate_word_hunt_words
from .solver import generate_weaver_path, generate_letter_boxed_pairs, generate_numbword_words

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
        if game == "weaver":
            try:
                path = generate_weaver_path(data.get("data"), data.get("wordLength"))
            except ValueError as error:
                return jsonify({"error": str(error)}), 400
            return jsonify({"path": path, "moves": len(path) - 1 if path else None})

        if game == "letterboxed":
            try:
                result = generate_letter_boxed_pairs(data.get("data"))
            except ValueError as error:
                return jsonify({"error": str(error)}), 400
            return jsonify(result)

        if game == "numbword":
            try:
                matches = generate_numbword_words(
                    data.get("wordLength"), data.get("targetScore"),
                    data.get("presentLetters", ""), data.get("absentLetters", ""),
                )
            except ValueError as error:
                return jsonify({"error": str(error)}), 400
            return jsonify({"words": matches, "total": len(matches)})

        letters = data.get("data", [])
        letters = [letter.lower() for letter in letters]

        if game == "anagrams":
            words = generate_anagram_words(letters)
        elif game == "spellingbee":
            words = generate_spelling_bee_words(letters, letters[0])
        elif game == "wordhunt":
            words = generate_word_hunt_words(letters)
        elif game == "letterloop":
            words = generate_letter_loop_combinations(letters)
        elif game == "quartiles":
            words = generate_quartiles_words(letters)
        else:
            return jsonify({"error": "Invalid game type"}), 400

        return jsonify({ "possible_words": words })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

if __name__ == "__main__":
    app.run(debug=True)

"""Find candidates by reproducing Wordle's exact, count-aware tile feedback."""

from collections import Counter


def normalize_guesses(guesses):
    if not isinstance(guesses, list) or not 1 <= len(guesses) <= 6:
        raise ValueError("Provide between one and six completed guesses.")
    normalized = []
    for index, row in enumerate(guesses, start=1):
        if not isinstance(row, dict):
            raise ValueError(f"Guess {index} must include a word and five colors.")
        word = row.get("word")
        if not isinstance(word, str):
            raise ValueError(f"Guess {index} must be a five-letter word (A–Z).")
        word = word.strip()
        if len(word) != 5 or not word.isascii() or not word.isalpha():
            raise ValueError(f"Guess {index} must contain exactly five letters (A–Z).")
        colors = row.get("colors")
        if not isinstance(colors, list) or len(colors) != 5 or any(
            not isinstance(color, str) or color not in ("gray", "yellow", "green")
            for color in colors
        ):
            raise ValueError(f"Mark all five tiles in guess {index} gray, yellow, or green.")
        normalized.append((word.lower(), tuple(colors)))
    return normalized


def wordle_feedback(answer, guess):
    """Reserve green matches first, then allocate yellows from left to right."""
    colors = ["gray"] * len(guess)
    remaining = Counter()
    for index, (actual, guessed) in enumerate(zip(answer, guess)):
        if actual == guessed:
            colors[index] = "green"
        else:
            remaining[actual] += 1
    for index, letter in enumerate(guess):
        if colors[index] != "green" and remaining[letter] > 0:
            colors[index] = "yellow"
            remaining[letter] -= 1
    return tuple(colors)


def find_wordle_words(guesses, dictionary):
    clues = normalize_guesses(guesses)
    candidates = set()
    for entry in dictionary:
        word = entry.strip()
        if len(word) == 5 and word.isascii() and word.isalpha():
            word = word.lower()
            if all(wordle_feedback(word, guess) == colors for guess, colors in clues):
                candidates.add(word)
    return sorted(candidates)

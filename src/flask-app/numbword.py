"""Filter Numbword candidates by letter sum and position-free presence clues."""


def normalize_clues(value, label):
    if not isinstance(value, str):
        raise ValueError(f"{label} must be text containing only letters A–Z.")
    value = value.strip().lower()
    if value and (not value.isascii() or not value.isalpha()):
        raise ValueError(f"{label} must contain only letters A–Z, without spaces or punctuation.")
    # A clue means membership, not a count of occurrences.
    return set(value)


def find_numbword_words(word_length, target_score, present_letters, absent_letters, dictionary):
    if type(word_length) is not int or word_length not in (4, 5, 6):
        raise ValueError("Choose a word length of 4, 5, or 6.")
    if type(target_score) is not int or not word_length <= target_score <= 26 * word_length:
        raise ValueError(f"Enter a whole-number target total from {word_length} to {26 * word_length}.")

    present = normalize_clues(present_letters, "Letters in the word")
    absent = normalize_clues(absent_letters, "Letters not in the word")
    overlap = present & absent
    if overlap:
        raise ValueError(f"A letter cannot be both present and absent: {', '.join(sorted(overlap)).upper()}.")
    if len(present) > word_length:
        raise ValueError(f"A {word_length}-letter word cannot contain {len(present)} different required letters.")

    matches = set()
    for entry in dictionary:
        word = entry.strip().lower()
        if len(word) != word_length or not word.isascii() or not word.isalpha():
            continue
        if not present.issubset(word) or not absent.isdisjoint(word):
            continue
        # Count every occurrence: APPLE is 1 + 16 + 16 + 12 + 5 = 50.
        if sum(ord(letter) - ord('a') + 1 for letter in word) == target_score:
            matches.add(word)
    return sorted(matches)

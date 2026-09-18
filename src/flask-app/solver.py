from itertools import permutations
from functools import lru_cache
from .trie import Trie
from .weaver import shortest_word_ladder
from .letter_boxed import find_letter_boxed_pairs
from .numbword import find_numbword_words
from .wordle import find_wordle_words
import os

# Initialize the global trie
trie = Trie()
words = []
five_letter_words = []

# Load words from large.txt into the trie
file_path = os.path.join(os.path.dirname(__file__), '../dictionaries/large.txt')
with open(file_path, 'r') as file:
    for word in file:
        trie.insert(word.strip())

# Load words from large.txt into an array
with open(file_path, 'r') as file:
    words = [word.strip() for word in file]

# Load five-letter words from five-letter-words.txt into an array
file_path = os.path.join(os.path.dirname(__file__), '../dictionaries/five_letter_words.txt')
with open(file_path, 'r') as file:
    five_letter_words = [word.strip() for word in file]

@lru_cache(maxsize=2)
def weaver_dictionary(word_length):
    return frozenset(
        word.lower() for word in words
        if len(word) == word_length and word.isascii() and word.isalpha()
    )


def generate_weaver_path(endpoints, word_length):
    """Validate both endpoints and find the minimum number of substitutions."""
    if type(word_length) is not int or word_length not in (4, 5):
        raise ValueError("Choose a word length of 4 or 5.")
    if not isinstance(endpoints, list) or len(endpoints) != 2:
        raise ValueError("Provide a start word and an end word.")

    normalized = []
    for label, word in zip(("Start", "End"), endpoints):
        if not isinstance(word, str):
            raise ValueError(f"{label} word must be text.")
        word = word.strip().lower()
        if len(word) != word_length or not word.isascii() or not word.isalpha():
            raise ValueError(f"{label} word must contain exactly {word_length} letters (A–Z).")
        normalized.append(word)

    return shortest_word_ladder(*normalized, weaver_dictionary(word_length))


def generate_letter_boxed_pairs(sides):
    return find_letter_boxed_pairs(sides, words)


def generate_numbword_words(word_length, target_score, present_letters, absent_letters):
    return find_numbword_words(word_length, target_score, present_letters, absent_letters, words)


def generate_anagram_words(letters):
    """Generate all possible words from given letters."""
    word_dict = {}

    for length in range(3, len(letters) + 1):
        word_dict[length] = set()

        # Searches every possible permutation to find valid words
        for perm in permutations(letters, length):
            word = ''.join(perm)

            if trie.search(word):
                word_dict[length].add(word)

        word_dict[length] = list(word_dict[length])

    return word_dict

def generate_spelling_bee_words(letters, mandatory_letter):
    """Generate all possible words from given letters with one mandatory letter."""
    word_dict = {}

    for word in words:
        if len(word) >= 4 and mandatory_letter in word and all(char in letters for char in word):
            length = len(word)

            if length not in word_dict:
                word_dict[length] = []

            word_dict[length].append(word)

    return word_dict

def generate_letter_loop_combinations(letters):
    """Generate pairs of five-letter words using all given letters."""
    word_pairs = []

    # Create a dictionary of letter counts for quick lookup
    letter_count = {char: letters.count(char) for char in set(letters)}
    valid_words = []

    # Find all valid five-letter words that can be formed using the given letters
    for word in five_letter_words:
        word_count = {char: word.count(char) for char in set(word)}
        if all(letter_count.get(char, 0) >= count for char, count in word_count.items()):
            valid_words.append(word)

    # Find all pairs of valid words that can be combined
    for i in range(len(valid_words)):
        for j in range(i + 1, len(valid_words)):
            word1 = valid_words[i]
            word2 = valid_words[j]
            word_count = {char: word1.count(char) + word2.count(char) for char in set(word1 + word2)}

            # Subtract the counts of shared letters
            word_count[word1[0]] -= 1
            word_count[word2[0]] -= 1

            # Determines if valid pair of words
            if all(letter_count.get(char, 0) >= count for char, count in word_count.items()) and word1[-1] == word2[0] and word2[-1] == word1[0]:
                word_pairs.append((word1, word2))

    return word_pairs

def generate_quartiles_words(fragments):
    """Generate valid words by combining 1-4 fragments."""
    valid_combinations = []

    def backtrack(current_combination, remaining_fragments):
        # Join current combination to form a word
        word = ''.join(current_combination)
        if trie.search(word):
            valid_combinations.append(tuple(current_combination))

        # Stop if the combination already has 4 fragments
        if len(current_combination) == 4:
            return
        
        # Check if the current word starts with a valid prefix
        if not trie.starts_with(word):
            return

        # Try adding each remaining fragment to the current combination
        for i in range(len(remaining_fragments)):
            backtrack(current_combination + [remaining_fragments[i]], remaining_fragments[:i] + remaining_fragments[i+1:])

    # Start backtracking with an empty combination
    backtrack([], fragments)

    return valid_combinations

def generate_word_hunt_words(letters):
    """Generate all possible words from a grid of letters using DFS traversal and the trie."""
    n = int(len(letters) ** 0.5)  # Determine the grid size (3x3, 4x4, or 5x5)
    grid = [list(letters[i * n:(i + 1) * n]) for i in range(n)]
    valid_words = set()
    directions = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]

    def dfs(x, y, path, visited):
        word = ''.join(path)
        if trie.search(word) and len(word) >= 3:
            valid_words.add(word)
        if not trie.starts_with(word):
            return

        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            if 0 <= nx < n and 0 <= ny < n and (nx, ny) not in visited:
                visited.add((nx, ny))
                dfs(nx, ny, path + [grid[nx][ny]], visited)
                visited.remove((nx, ny))

    for i in range(n):
        for j in range(n):
            dfs(i, j, [grid[i][j]], {(i, j)})

    found_words = {}
    for word in valid_words:
        if len(word) not in found_words:
            found_words[len(word)] = []
        found_words[len(word)].append(word)

    return found_words

@lru_cache(maxsize=2)
def wordle_dictionary(word_list):
    path = os.path.join(os.path.dirname(__file__), '../dictionaries/solution_list.txt')
    with open(path, 'r') as file:
        entries = [word.strip() for word in file]
    if word_list == "extended":
        entries.extend(five_letter_words)
    return frozenset(word.lower() for word in entries
                     if len(word) == 5 and word.isascii() and word.isalpha())


def generate_wordle_words(guesses, word_list="answers"):
    if word_list not in ("answers", "extended"):
        raise ValueError("Choose the answer list or the extended word list.")
    return find_wordle_words(guesses, wordle_dictionary(word_list))

from itertools import permutations
from trie import Trie
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

def generate_anagram_words(letters):
    """Generate all possible words from given letters."""
    word_dict = {}

    for length in range(3, len(letters) + 1):
        word_dict[length] = set()  # Use a set to avoid duplicates

        for perm in permutations(letters, length):
            word = ''.join(perm)

            if trie.search(word):
                word_dict[length].add(word)

        word_dict[length] = list(word_dict[length])  # Convert set back to list

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

    for word in five_letter_words:
        word_count = {char: word.count(char) for char in set(word)}
        if all(letter_count.get(char, 0) >= count for char, count in word_count.items()):
            valid_words.append(word)

    for i in range(len(valid_words)):
        for j in range(i + 1, len(valid_words)):
            word1 = valid_words[i]
            word2 = valid_words[j]
            word_count = {char: word1.count(char) + word2.count(char) for char in set(word1 + word2)}
            word_count[word1[0]] -= 1
            word_count[word2[0]] -= 1
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

# Example usage
letters = "abcdefghijklmnop"  # Replace with 9, 16, or 25 letters
result = generate_word_hunt_words(letters)
print(result)

# fragments = ["bac", "ks", "tree", "ts", "mis", "re", "pre", "sent", "th", "ems", "elv", "es", "flo", "od", "lig", "hts", "nutc", "ra", "cke", "rs"]
# result = generate_quartiles_words(fragments)
# print(result)

# Example usage
# letters = "ygraaeel"
# result = generate_letter_loop_combinations(letters)
# print(result)

# def generate_word_hunt_words()
# def generate_quartiles_words()

# # Example usage
# letters = "normacy"  # Replace with 7 unique letters
# mandatory_letter = "m"  # Replace with the mandatory letter
# result = generate_anagram_words(letters)
# # result = generate_spelling_bee_words(letters, mandatory_letter)
# print(result)

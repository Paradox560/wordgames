from itertools import permutations
from trie import Trie
import os

# Initialize the global trie
trie = Trie()
words = []

# Load words from large.txt into the trie
file_path = os.path.join(os.path.dirname(__file__), '../dictionaries/large.txt')
with open(file_path, 'r') as file:
    for word in file:
        trie.insert(word.strip())

# Load words from large.txt into an array
with open(file_path, 'r') as file:
    words = [word.strip() for word in file]

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

# # Example usage
# letters = "normacy"  # Replace with 7 unique letters
# mandatory_letter = "m"  # Replace with the mandatory letter
# result = generate_anagram_words(letters)
# # result = generate_spelling_bee_words(letters, mandatory_letter)
# print(result)

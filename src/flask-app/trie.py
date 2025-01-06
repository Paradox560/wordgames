class TrieNode:
    def __init__(self):
        self.children = {}  # Dictionary to store child nodes
        self.is_end_of_word = False  # Indicates if a word ends at this node

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        """Inserts a word into the trie."""
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()  # Create a new node if character not found
            node = node.children[char]
        node.is_end_of_word = True  # Mark the end of the word

    def search(self, word):
        """Searches for a word in the trie."""
        node = self.root
        for char in word:
            if char not in node.children:
                return False  # Word not found
            node = node.children[char]
        return node.is_end_of_word  # Return True if it's the end of the word

    def starts_with(self, prefix):
        """Checks if any word in the trie starts with the given prefix."""
        node = self.root
        for char in prefix:
            if char not in node.children:
                return False  # Prefix not found
            node = node.children[char]
        return True  # Prefix exists

# Example usage
words = ["apple", "app", "apricot", "bat", "ball"]
trie = Trie()

# Insert words into the trie
for word in words:
    trie.insert(word)

# Search for words in the trie
print(trie.search("apple"))  # True
print(trie.search("apricot"))  # True
print(trie.search("app"))  # True
print(trie.search("batman"))  # False

# Check for prefixes
print(trie.starts_with("app"))  # True
print(trie.starts_with("bat"))  # True
print(trie.starts_with("cat"))  # False

def get_words(letter_array):
    return {5: "Hello"}
"""Shortest word ladders using one-letter substitutions."""

from collections import deque
from string import ascii_lowercase


def shortest_word_ladder(start, end, dictionary):
    """Return one shortest inclusive path, or [] when the words are disconnected.

    Breadth-first search visits words in increasing move count. Generate only
    single-letter substitutions, so every edge is a legal move of equal cost.
    """
    for label, word in (("Start", start), ("End", end)):
        if word not in dictionary:
            raise ValueError(f"{label} word '{word.upper()}' is not in our dictionary.")

    parents = {start: None}
    pending = deque([start])

    while pending:
        word = pending.popleft()
        if word == end:
            path = []
            while word is not None:
                path.append(word)
                word = parents[word]
            return path[::-1]

        for index, current_letter in enumerate(word):
            for letter in ascii_lowercase:
                if letter == current_letter:
                    continue
                neighbor = word[:index] + letter + word[index + 1:]
                if neighbor in dictionary and neighbor not in parents:
                    parents[neighbor] = word
                    pending.append(neighbor)

    return []

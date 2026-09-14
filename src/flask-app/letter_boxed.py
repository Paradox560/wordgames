"""Two-word Letter Boxed solutions with side-aware word validation."""

from collections import defaultdict
from heapq import nsmallest


def normalize_sides(sides):
    if not isinstance(sides, list) or len(sides) != 4:
        raise ValueError("Provide four sides: top, right, bottom, and left.")

    normalized = []
    for label, side in zip(("Top", "Right", "Bottom", "Left"), sides):
        if not isinstance(side, str):
            raise ValueError(f"{label} side must contain three letters (A–Z).")
        side = side.strip().lower()
        if len(side) != 3 or not side.isascii() or not side.isalpha():
            raise ValueError(f"{label} side must contain exactly three letters (A–Z).")
        normalized.append(side)

    if len(set("".join(normalized))) != 12:
        raise ValueError("Use 12 different letters. A letter cannot appear on two tiles.")
    return normalized


def find_letter_boxed_pairs(sides, dictionary, limit=20):
    """Find all valid ordered pairs; return the shortest `limit` by total length.

    Each candidate uses only the board, contains at least three letters, and
    switches sides between every adjacent letter. A 12-bit mask records its
    coverage. Indexing candidates by their first letter restricts pair matching
    to words that can actually follow the first word.
    """
    sides = normalize_sides(sides)
    side_of = {letter: side for side, letters in enumerate(sides) for letter in letters}
    bits = {letter: 1 << i for i, letter in enumerate("".join(sides))}
    full_mask = (1 << 12) - 1
    candidates = {}

    for entry in dictionary:
        word = entry.strip().lower()
        if len(word) < 3 or word in candidates:
            continue
        mask = 0
        previous_side = None
        for letter in word:
            side = side_of.get(letter)
            if side is None or side == previous_side:
                break
            mask |= bits[letter]
            previous_side = side
        else:
            candidates[word] = mask

    by_first = defaultdict(list)
    for word, mask in candidates.items():
        by_first[word[0]].append((word, mask))

    total = 0

    def matching_pairs():
        nonlocal total
        for first, first_mask in candidates.items():
            for second, second_mask in by_first[first[-1]]:
                if first_mask | second_mask == full_mask:
                    total += 1
                    yield (first, second)

    # Keep only the best few pairs in memory while counting every solution.
    solutions = nsmallest(limit, matching_pairs(), key=lambda pair: (sum(map(len, pair)), pair))
    return {"solutions": [list(pair) for pair in solutions], "total": total}

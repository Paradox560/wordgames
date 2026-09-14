import importlib
import random
import unittest
from unittest.mock import patch


letter_boxed = importlib.import_module("src.flask-app.letter_boxed")
solver = importlib.import_module("src.flask-app.solver")
app = importlib.import_module("src.flask-app.app").app

EXAMPLE = ["bkt", "lsh", "amp", "cir"]


def reference_pairs(sides, dictionary):
    """Independent exhaustive checks using sets and explicit side comparisons."""
    side_of = {letter: i for i, side in enumerate(sides) for letter in side}
    board = set(side_of)
    valid = {word.strip().lower() for word in dictionary}
    valid = {word for word in valid if len(word) >= 3 and set(word) <= board
             and all(side_of[a] != side_of[b] for a, b in zip(word, word[1:]))}
    pairs = [(first, second) for first in valid for second in valid
             if first[-1] == second[0] and set(first + second) == board]
    return sorted(pairs, key=lambda pair: (len(pair[0]) + len(pair[1]), pair))


class LetterBoxedTests(unittest.TestCase):
    def test_known_two_word_solution(self):
        result = letter_boxed.find_letter_boxed_pairs(EXAMPLE, ["blacksmith", "harp"])
        self.assertEqual(result, {"solutions": [["blacksmith", "harp"]], "total": 1})

    def test_all_pairs_sorted_by_combined_length(self):
        dictionary = ["harps", "blacksmith", "harp", "blacksmith", "HARP"]
        result = letter_boxed.find_letter_boxed_pairs(EXAMPLE, dictionary)
        self.assertEqual(result, {"solutions": [["blacksmith", "harp"], ["blacksmith", "harps"]], "total": 2})

    def test_limit_preserves_total_count(self):
        result = letter_boxed.find_letter_boxed_pairs(EXAMPLE, ["blacksmith", "harps", "harp"], limit=1)
        self.assertEqual(result, {"solutions": [["blacksmith", "harp"]], "total": 2})

    def test_sides_matter_even_when_all_letters_match(self):
        result = letter_boxed.find_letter_boxed_pairs(["bla", "ksh", "mtp", "cir"], ["blacksmith", "harp"])
        self.assertEqual(result["total"], 0)

    def test_words_must_link_in_order(self):
        # Both words alternate sides and together cover the board, but H != P.
        result = letter_boxed.find_letter_boxed_pairs(EXAMPLE, ["blacksmith", "prat"])
        self.assertEqual(result["total"], 0)

    def test_coverage_is_required(self):
        result = letter_boxed.find_letter_boxed_pairs(EXAMPLE, ["harm", "milk"])
        self.assertEqual(result, {"solutions": [], "total": 0})

    def test_letters_not_on_board_are_rejected(self):
        result = letter_boxed.find_letter_boxed_pairs(EXAMPLE, ["blacksmith", "harpy"])
        self.assertEqual(result["total"], 0)

    def test_three_letter_minimum(self):
        sides = ["abc", "def", "ghi", "jkl"]
        result = letter_boxed.find_letter_boxed_pairs(sides, ["adgjbehkcfi", "il", "ild"])
        self.assertEqual(result, {"solutions": [["adgjbehkcfi", "ild"]], "total": 1})

    def test_nonconsecutive_letter_reuse_is_allowed(self):
        first = "adgadgjbehkcfi"
        result = letter_boxed.find_letter_boxed_pairs(["abc", "def", "ghi", "jkl"], [first, "ild"])
        self.assertEqual(result, {"solutions": [[first, "ild"]], "total": 1})

    def test_both_orders_retained_when_both_links_work(self):
        first = "adgjbehkcfi"
        result = letter_boxed.find_letter_boxed_pairs(["abc", "def", "ghi", "jkl"], [first, "ila"])
        self.assertEqual(result, {"solutions": [[first, "ila"], ["ila", first]], "total": 2})

    def test_consecutive_repeated_letters_are_rejected(self):
        result = letter_boxed.find_letter_boxed_pairs(EXAMPLE, ["blacksmith", "haarp"])
        self.assertEqual(result["total"], 0)

    def test_normalizes_case_and_whitespace(self):
        result = letter_boxed.find_letter_boxed_pairs([" BKT ", "LsH", "AMP", "cir"], [" BLACKSMITH ", "HARP"])
        self.assertEqual(result, {"solutions": [["blacksmith", "harp"]], "total": 1})

    def test_complete_results_match_independent_reference(self):
        rng = random.Random(91)
        sides = ["abc", "def", "ghi", "jkl"]
        for _ in range(30):
            dictionary = ["adgjbehkcfi", "ila", "ilad", "ilag"]
            for _ in range(75):
                dictionary.append("".join(rng.choices("abcdefghijkl", k=rng.randrange(3, 16))))
            expected = reference_pairs(sides, dictionary)
            result = letter_boxed.find_letter_boxed_pairs(sides, dictionary, limit=3)
            self.assertEqual(result["total"], len(expected))
            self.assertEqual(result["solutions"], [list(pair) for pair in expected[:3]])

    def test_no_words_available(self):
        self.assertEqual(letter_boxed.find_letter_boxed_pairs(EXAMPLE, []), {"solutions": [], "total": 0})


class LetterBoxedApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def post(self, sides):
        return self.client.post("/api/solve", json={"game": "letterboxed", "data": sides})

    def test_real_dictionary_solutions_satisfy_every_rule(self):
        response = self.post(EXAMPLE)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertGreater(data["total"], 0)
        self.assertLessEqual(len(data["solutions"]), 20)
        dictionary = set(solver.words)
        side_of = {letter: i for i, side in enumerate(EXAMPLE) for letter in side}
        lengths = []
        for first, second in data["solutions"]:
            self.assertIn(first, dictionary)
            self.assertIn(second, dictionary)
            self.assertGreaterEqual(min(len(first), len(second)), 3)
            self.assertEqual(first[-1], second[0])
            self.assertEqual(set(first + second), set("".join(EXAMPLE)))
            # The shared letter appears only once when tracing the joined route.
            chain = first + second[1:]
            for a, b in zip(chain, chain[1:]):
                self.assertNotEqual(side_of[a], side_of[b])
            lengths.append(len(first) + len(second))
        self.assertEqual(lengths, sorted(lengths))

    def test_malformed_sides(self):
        for sides in [None, "abcdefghijkl", [], EXAMPLE[:3], EXAMPLE + ["xyz"],
                      ["ab", "def", "ghi", "jkl"], ["abcd", "def", "ghi", "jkl"],
                      [1, "def", "ghi", "jkl"], [None, "def", "ghi", "jkl"],
                      [["a", "b", "c"], "def", "ghi", "jkl"],
                      ["a1c", "def", "ghi", "jkl"], ["aéc", "def", "ghi", "jkl"],
                      ["a c", "def", "ghi", "jkl"]]:
            with self.subTest(sides=sides):
                response = self.post(sides)
                self.assertEqual(response.status_code, 400)
                self.assertIn("error", response.get_json())

    def test_duplicate_letters_on_same_and_different_sides(self):
        for sides in [["aba", "def", "ghi", "jkl"], ["abc", "def", "ghi", "jka"]]:
            with self.subTest(sides=sides):
                response = self.post(sides)
                self.assertEqual(response.status_code, 400)
                self.assertIn("12 different letters", response.get_json()["error"])

    def test_no_pair_is_successful_empty_result(self):
        with patch.object(solver, "words", ["blacksmith", "prat"]):
            response = self.post(EXAMPLE)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"solutions": [], "total": 0})

    def test_full_api_matches_expected_pair(self):
        with patch.object(solver, "words", ["blacksmith", "harp"]):
            response = self.post([side.upper() for side in EXAMPLE])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"solutions": [["blacksmith", "harp"]], "total": 1})


if __name__ == "__main__":
    unittest.main()

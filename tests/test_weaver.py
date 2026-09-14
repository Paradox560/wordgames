import importlib
import itertools
import random
import unittest
from collections import deque
from unittest.mock import patch


weaver = importlib.import_module("src.flask-app.weaver")
solver = importlib.import_module("src.flask-app.solver")
app = importlib.import_module("src.flask-app.app").app


class ShortestLadderTests(unittest.TestCase):
    def assert_valid_path(self, path, start, end, dictionary):
        self.assertEqual(path[0], start)
        self.assertEqual(path[-1], end)
        self.assertEqual(len(path), len(set(path)))
        for word in path:
            self.assertIn(word, dictionary)
        for before, after in zip(path, path[1:]):
            self.assertEqual(len(before), len(after))
            self.assertEqual(sum(a != b for a, b in zip(before, after)), 1)

    def test_four_letter_shortest_path(self):
        dictionary = {"cold", "cord", "card", "ward", "warm", "word", "worm"}
        path = weaver.shortest_word_ladder("cold", "warm", dictionary)
        self.assert_valid_path(path, "cold", "warm", dictionary)
        self.assertEqual(len(path) - 1, 4)

    def test_five_letter_shortest_path(self):
        dictionary = {"stone", "store", "shore", "score", "stony"}
        path = weaver.shortest_word_ladder("stone", "shore", dictionary)
        self.assert_valid_path(path, "stone", "shore", dictionary)
        self.assertEqual(len(path) - 1, 2)

    def test_path_can_need_more_moves_than_differing_letters(self):
        dictionary = {"head", "heal", "teal", "tell", "tall", "tail"}
        path = weaver.shortest_word_ladder("head", "tail", dictionary)
        self.assert_valid_path(path, "head", "tail", dictionary)
        self.assertEqual(len(path) - 1, 5)

    def test_equal_words_require_zero_moves(self):
        self.assertEqual(weaver.shortest_word_ladder("cold", "cold", {"cold"}), ["cold"])

    def test_direct_neighbor_requires_one_move(self):
        self.assertEqual(weaver.shortest_word_ladder("cold", "cord", {"cold", "cord"}), ["cold", "cord"])

    def test_no_path(self):
        self.assertEqual(weaver.shortest_word_ladder("cold", "warm", {"cold", "warm"}), [])

    def test_unknown_endpoints_including_equal_unknown_words(self):
        for start, end in [("zzzz", "cold"), ("cold", "zzzz"), ("zzzz", "zzzz")]:
            with self.subTest(start=start, end=end), self.assertRaises(ValueError):
                weaver.shortest_word_ladder(start, end, {"cold"})

    def test_cannot_reorder_letters(self):
        self.assertEqual(weaver.shortest_word_ladder("stop", "pots", {"stop", "pots"}), [])

    def test_minimality_against_independent_explicit_graph(self):
        # Compare implicit substitutions against all-pairs Hamming-distance edges.
        rng = random.Random(27)
        universe = ["".join(chars) for chars in itertools.product("abc", repeat=4)]
        for _ in range(30):
            dictionary = set(rng.sample(universe, 30))
            start, end = rng.sample(sorted(dictionary), 2)
            graph = {word: [other for other in dictionary
                            if sum(a != b for a, b in zip(word, other)) == 1]
                     for word in dictionary}
            distances = {start: 0}
            pending = deque([start])
            while pending:
                current = pending.popleft()
                for neighbor in graph[current]:
                    if neighbor not in distances:
                        distances[neighbor] = distances[current] + 1
                        pending.append(neighbor)

            path = weaver.shortest_word_ladder(start, end, dictionary)
            self.assertEqual(len(path) - 1 if path else None, distances.get(end))
            if path:
                self.assert_valid_path(path, start, end, dictionary)


class WeaverApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def post(self, endpoints, length=4):
        return self.client.post("/api/solve", json={
            "game": "weaver", "data": endpoints, "wordLength": length,
        })

    def test_both_modes_with_real_dictionary(self):
        for length, start, end, minimum in [(4, "cold", "warm", 4), (5, "stone", "shore", 2)]:
            with self.subTest(length=length):
                response = self.post([start, end], length)
                self.assertEqual(response.status_code, 200)
                data = response.get_json()
                self.assertEqual(data["moves"], minimum)
                ShortestLadderTests().assert_valid_path(data["path"], start, end, solver.weaver_dictionary(length))

    def test_case_and_surrounding_whitespace(self):
        response = self.post([" COLD ", "WaRm"])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["path"][0], "cold")
        self.assertEqual(response.get_json()["path"][-1], "warm")

    def test_invalid_modes(self):
        for length in [None, 3, 6, "4", True, 4.0]:
            with self.subTest(length=length):
                response = self.post(["cold", "warm"], length)
                self.assertEqual(response.status_code, 400)
                self.assertIn("error", response.get_json())

    def test_invalid_endpoints(self):
        for endpoints in [None, "cold", [], ["cold"], ["cold", "warm", "word"],
                          [None, "warm"], ["cold", 12], ["col", "warm"],
                          ["cold", "shore"], ["c0ld", "warm"], ["cöld", "warm"],
                          ["co d", "warm"], ["", ""]]:
            with self.subTest(endpoints=endpoints):
                self.assertEqual(self.post(endpoints).status_code, 400)

    def test_missing_words_are_validation_errors(self):
        response = self.post(["zzzz", "cold"])
        self.assertEqual(response.status_code, 400)
        self.assertIn("not in our dictionary", response.get_json()["error"])

    def test_no_path_is_a_successful_empty_result(self):
        with patch.object(solver, "weaver_dictionary", return_value={"cold", "warm"}):
            response = self.post(["cold", "warm"])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"path": [], "moves": None})

    def test_identical_words(self):
        response = self.post(["cold", "cold"])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"path": ["cold"], "moves": 0})

    def test_existing_anagrams_contract(self):
        response = self.client.post("/api/solve", json={"game": "anagrams", "data": ["C", "A", "T"]})
        self.assertEqual(response.status_code, 200)
        self.assertIn("cat", response.get_json()["possible_words"]["3"])


if __name__ == "__main__":
    unittest.main()

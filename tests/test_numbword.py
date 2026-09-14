import importlib
import itertools
import random
import unittest
from unittest.mock import patch


numbword = importlib.import_module("src.flask-app.numbword")
solver = importlib.import_module("src.flask-app.solver")
app = importlib.import_module("src.flask-app.app").app
ALPHABET = "abcdefghijklmnopqrstuvwxyz"


class NumbwordTests(unittest.TestCase):
    def find(self, dictionary, length=5, score=50, present="", absent=""):
        return numbword.find_numbword_words(length, score, present, absent, dictionary)

    def test_four_five_and_six_letter_modes(self):
        dictionary = ["cold", "apple", "planet"]
        for length, score, expected in [(4, 34, "cold"), (5, 50, "apple"), (6, 68, "planet")]:
            with self.subTest(length=length):
                self.assertEqual(self.find(dictionary, length, score), [expected])

    def test_score_counts_every_occurrence(self):
        self.assertEqual(self.find(["apple"]), ["apple"])
        self.assertEqual(self.find(["apple"], score=34), [])

    def test_presence_is_not_a_position(self):
        self.assertEqual(self.find(["stop", "post", "pots", "spot"], 4, 70, "TS"),
                         ["post", "pots", "spot", "stop"])

    def test_duplicate_clues_do_not_force_multiple_copies(self):
        self.assertEqual(self.find(["stop", "post", "pots", "spot"], 4, 70, "PPPPP"),
                         ["post", "pots", "spot", "stop"])
        self.assertEqual(self.find(["apple"], present="P"), ["apple"])

    def test_every_present_letter_is_required(self):
        self.assertEqual(self.find(["apple"], present="APZ"), [])
        self.assertEqual(self.find(["apple"], present="AP"), ["apple"])

    def test_any_absent_letter_eliminates_word(self):
        for absent in ["P", "AZ", "aple", "PP"]:
            with self.subTest(absent=absent):
                self.assertEqual(self.find(["apple"], absent=absent), [])
        self.assertEqual(self.find(["apple"], absent="ST"), ["apple"])

    def test_wrong_length_is_excluded_even_with_matching_total(self):
        self.assertEqual(self.find(["zz", "zzaa", "zzaaa"], 4, 52), [])

    def test_dictionary_normalization_deduplication_and_alphabetic_sort(self):
        self.assertEqual(self.find(["stop", "POTS", " post ", "POST", "Stop"], 4, 70),
                         ["post", "pots", "stop"])

    def test_non_ascii_and_non_letters_are_excluded(self):
        self.assertEqual(self.find(["applé", "app1e", "app-e", "", "APPLE"], 5, 50), ["apple"])

    def test_no_matches_and_empty_dictionary(self):
        self.assertEqual(self.find([]), [])
        self.assertEqual(self.find(["apple"], score=51), [])

    def test_clue_case_and_surrounding_whitespace(self):
        self.assertEqual(self.find(["apple"], present=" aP ", absent=" St "), ["apple"])

    def test_score_boundaries(self):
        for length in (4, 5, 6):
            with self.subTest(length=length):
                dictionary = ["a" * length, "z" * length]
                self.assertEqual(self.find(dictionary, length, length), ["a" * length])
                self.assertEqual(self.find(dictionary, length, length * 26), ["z" * length])

    def test_matches_independent_exhaustive_reference(self):
        rng = random.Random(12)
        for length in (4, 5, 6):
            dictionary = ["".join(chars) for chars in itertools.product("abc", repeat=length)]
            for _ in range(20):
                score = rng.randint(length, length * 3)
                present = "".join(rng.sample("abc", rng.randint(0, 2)))
                available = [letter for letter in "abc" if letter not in present]
                absent = "".join(rng.sample(available, rng.randint(0, len(available))))
                expected = sorted(word for word in dictionary
                                  if sum(ALPHABET.index(char) + 1 for char in word) == score
                                  and all(char in word for char in present)
                                  and all(char not in word for char in absent))
                self.assertEqual(self.find(dictionary, length, score, present, absent), expected)


class NumbwordApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def post(self, **overrides):
        payload = {"game": "numbword", "wordLength": 5, "targetScore": 50}
        payload.update(overrides)
        return self.client.post("/api/solve", json=payload)

    def test_all_modes_with_real_dictionary(self):
        examples = [(4, 34, "CL", "WR", "cold"), (5, 50, "AP", "ST", "apple"),
                    (6, 68, "PN", "SR", "planet")]
        for length, score, present, absent, example in examples:
            with self.subTest(length=length):
                response = self.post(wordLength=length, targetScore=score,
                                     presentLetters=present, absentLetters=absent)
                self.assertEqual(response.status_code, 200)
                data = response.get_json()
                self.assertIn(example, data["words"])
                self.assertEqual(data["total"], len(data["words"]))
                self.assertEqual(data["words"], sorted(set(data["words"])))
                for word in data["words"]:
                    self.assertEqual(len(word), length)
                    self.assertTrue(word.isascii() and word.isalpha())
                    self.assertEqual(sum(ALPHABET.index(char) + 1 for char in word), score)
                    self.assertTrue(all(char.lower() in word for char in present))
                    self.assertTrue(all(char.lower() not in word for char in absent))

    def test_optional_clues_allow_score_only_search(self):
        with patch.object(solver, "words", ["apple", "APPLE", "aaaaa"]):
            response = self.post()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"words": ["apple"], "total": 1})

    def test_no_matches_is_successful_empty_result(self):
        with patch.object(solver, "words", ["apple"]):
            response = self.post(absentLetters="P")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"words": [], "total": 0})

    def test_refining_guesses_only_removes_candidates(self):
        initial = self.post().get_json()["words"]
        refined = self.post(presentLetters="P").get_json()["words"]
        final = self.post(presentLetters="AP", absentLetters="ST").get_json()["words"]
        self.assertTrue(set(final) <= set(refined) <= set(initial))
        self.assertIn("apple", final)

    def test_invalid_lengths(self):
        for length in [None, 3, 7, "5", True, 5.0, [], {}]:
            with self.subTest(length=length):
                response = self.post(wordLength=length)
                self.assertEqual(response.status_code, 400)
                self.assertIn("error", response.get_json())

    def test_invalid_scores(self):
        for length in (4, 5, 6):
            for score in [None, 0, -1, length - 1, length * 26 + 1, "50", True, 50.0, 50.5, [], {}]:
                with self.subTest(length=length, score=score):
                    response = self.post(wordLength=length, targetScore=score)
                    self.assertEqual(response.status_code, 400)
                    self.assertIn("error", response.get_json())

    def test_missing_required_fields(self):
        for payload in [{"game": "numbword"}, {"game": "numbword", "wordLength": 5},
                        {"game": "numbword", "targetScore": 50}]:
            self.assertEqual(self.client.post("/api/solve", json=payload).status_code, 400)

    def test_invalid_clue_types_and_characters(self):
        for field in ["presentLetters", "absentLetters"]:
            for clue in [None, 1, False, ["A"], {}, "A P", "A,P", "AP!", "é", "123"]:
                with self.subTest(field=field, clue=clue):
                    self.assertEqual(self.post(**{field: clue}).status_code, 400)

    def test_contradictory_clues_are_validation_errors(self):
        response = self.post(presentLetters="ap", absentLetters="SP")
        self.assertEqual(response.status_code, 400)
        self.assertIn("both present and absent: P", response.get_json()["error"])

    def test_too_many_distinct_required_letters(self):
        response = self.post(presentLetters="ABCDEF")
        self.assertEqual(response.status_code, 400)
        self.assertIn("6 different", response.get_json()["error"])

    def test_repeated_present_clues_are_not_count_constraints(self):
        with patch.object(solver, "words", ["apple"]):
            response = self.post(presentLetters="AAAAAA")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"words": ["apple"], "total": 1})


if __name__ == "__main__":
    unittest.main()

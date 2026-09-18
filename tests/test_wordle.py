import importlib
import itertools
import random
import unittest
from unittest.mock import patch


wordle = importlib.import_module("src.flask-app.wordle")
solver = importlib.import_module("src.flask-app.solver")
app = importlib.import_module("src.flask-app.app").app
GRAY, YELLOW, GREEN = "gray", "yellow", "green"


def row(word, pattern):
    return {"word": word, "colors": [{"b": GRAY, "y": YELLOW, "g": GREEN}[color] for color in pattern]}


def reference_feedback(answer, guess):
    """Independent oracle: cross off matched positions rather than count letters."""
    remaining = list(answer)
    result = [GRAY] * 5
    for position in range(5):
        if answer[position] == guess[position]:
            result[position] = GREEN
            remaining[position] = None
    for position in range(5):
        if result[position] == GREEN:
            continue
        if guess[position] in remaining:
            result[position] = YELLOW
            remaining[remaining.index(guess[position])] = None
    return tuple(result)


class WordleFeedbackTests(unittest.TestCase):
    def test_all_green(self):
        self.assertEqual(wordle.wordle_feedback("cigar", "cigar"), (GREEN,) * 5)

    def test_all_gray(self):
        self.assertEqual(wordle.wordle_feedback("cigar", "blunt"), (GRAY,) * 5)

    def test_yellow_means_present_but_not_here(self):
        self.assertEqual(wordle.wordle_feedback("crane", "react"), (YELLOW, YELLOW, GREEN, YELLOW, GRAY))

    def test_gray_extra_does_not_eliminate_yellow_letter(self):
        self.assertEqual(wordle.wordle_feedback("apple", "alley"), (GREEN, YELLOW, GRAY, YELLOW, GRAY))

    def test_greens_take_priority_over_earlier_yellows(self):
        self.assertEqual(wordle.wordle_feedback("abbey", "babbb"), (YELLOW, YELLOW, GREEN, GRAY, GRAY))

    def test_two_greens_and_three_extra_copies(self):
        self.assertEqual(wordle.wordle_feedback("level", "eeeee"), (GRAY, GREEN, GRAY, GREEN, GRAY))

    def test_yellows_allocate_left_to_right(self):
        self.assertEqual(wordle.wordle_feedback("aabbb", "baaab"), (YELLOW, GREEN, YELLOW, GRAY, GREEN))

    def test_full_feedback_matches_independent_oracle_exhaustively(self):
        words = ["".join(chars) for chars in itertools.product("ab", repeat=5)]
        for answer in words:
            for guess in words:
                self.assertEqual(wordle.wordle_feedback(answer, guess), reference_feedback(answer, guess))


class WordleCandidateTests(unittest.TestCase):
    def test_known_example_with_repeated_letter(self):
        result = wordle.find_wordle_words([row("ALLEY", "gybyb")], ["apple", "ample", "alley", "apply", "hello"])
        self.assertEqual(result, ["ample", "apple"])

    def test_extra_gray_caps_letter_count(self):
        clues = [row("papal", "yygby")]
        self.assertEqual(wordle.find_wordle_words(clues, ["apple", "papal", "appla", "paple"]), ["apple"])

    def test_missing_gray_allows_more_than_confirmed_copy(self):
        clues = [{"word": "crane", "colors": list(reference_feedback("apple", "crane"))}]
        self.assertEqual(wordle.find_wordle_words(clues, ["apple", "ample"]), ["ample", "apple"])

    def test_letter_order_and_every_guess_matter(self):
        clues = [row("alley", "gybyb"), row("ample", "gbggg")]
        self.assertEqual(wordle.find_wordle_words(clues, ["apple", "ample", "amble", "angle"]), ["apple"])

    def test_conflicting_clues_return_no_candidates(self):
        clues = [row("apple", "ggggg"), row("ample", "ggggg")]
        self.assertEqual(wordle.find_wordle_words(clues, ["apple", "ample"]), [])

    def test_impossible_duplicate_color_order_returns_no_candidates(self):
        self.assertEqual(wordle.find_wordle_words([row("alley", "gbyyb")], ["apple", "ample"]), [])

    def test_normalization_sorting_and_deduplication(self):
        self.assertEqual(wordle.find_wordle_words([row(" ALLEY ", "gybyb")],
                                               ["APPLE", " ample ", "apple", "applé", "a p l", "apples", "ape"]),
                         ["ample", "apple"])

    def test_guess_does_not_have_to_be_in_candidate_dictionary(self):
        self.assertEqual(wordle.find_wordle_words([row("alley", "gybyb")], ["apple"]), ["apple"])

    def test_empty_dictionary(self):
        self.assertEqual(wordle.find_wordle_words([row("alley", "gybyb")], []), [])

    def test_filter_completeness_against_independent_reference(self):
        rng = random.Random(52)
        dictionary = ["".join(chars) for chars in itertools.product("abc", repeat=5)]
        for _ in range(30):
            answer = rng.choice(dictionary)
            guesses = rng.sample(dictionary, rng.randint(1, 6))
            clues = [{"word": guess, "colors": list(reference_feedback(answer, guess))} for guess in guesses]
            expected = sorted(candidate for candidate in dictionary
                              if all(reference_feedback(candidate, clue["word"]) == tuple(clue["colors"]) for clue in clues))
            actual = wordle.find_wordle_words(clues, dictionary)
            self.assertEqual(actual, expected)
            self.assertIn(answer, actual)


class WordleApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def post(self, guesses, **extra):
        return self.client.post("/api/solve", json={"game": "wordle", "guesses": guesses, **extra})

    def test_both_real_dictionaries_satisfy_every_clue(self):
        clues = [row("alley", "gybyb"), row("ample", "gbggg")]
        for mode in ("answers", "extended"):
            with self.subTest(mode=mode):
                response = self.post(clues, wordList=mode)
                self.assertEqual(response.status_code, 200)
                data = response.get_json()
                self.assertIn("apple", data["words"])
                self.assertEqual(data["total"], len(data["words"]))
                self.assertEqual(data["words"], sorted(set(data["words"])))
                for candidate in data["words"]:
                    self.assertIn(candidate, solver.wordle_dictionary(mode))
                    for clue in clues:
                        self.assertEqual(reference_feedback(candidate, clue["word"]), tuple(clue["colors"]))

    def test_extended_list_includes_entire_answer_list(self):
        answers = solver.wordle_dictionary("answers")
        extended = solver.wordle_dictionary("extended")
        self.assertTrue(answers < extended)
        self.assertGreater(len(answers), 2000)
        self.assertGreater(len(extended), 10000)

    def test_default_dictionary_and_all_green_result(self):
        response = self.post([row("cigar", "ggggg")])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"words": ["cigar"], "total": 1})

    def test_past_answers_are_not_excluded(self):
        self.assertIn("cigar", solver.wordle_dictionary("answers"))

    def test_more_guesses_only_remove_candidates(self):
        first = [row("alley", "gybyb")]
        before = self.post(first).get_json()["words"]
        after = self.post(first + [row("ample", "gbggg")]).get_json()["words"]
        self.assertTrue(set(after) < set(before))
        self.assertIn("apple", after)

    def test_gray_only_guess_can_have_results(self):
        response = self.post([row("blunt", "bbbbb")])
        self.assertEqual(response.status_code, 200)
        self.assertIn("cigar", response.get_json()["words"])

    def test_no_candidates_is_successful_empty_result(self):
        response = self.post([row("apple", "ggggg"), row("ample", "ggggg")])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"words": [], "total": 0})

    def test_accepts_six_rows(self):
        response = self.post([row("apple", "ggggg")] * 6)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"words": ["apple"], "total": 1})

    def test_invalid_guess_collections(self):
        for guesses in [None, {}, "apple", [], [row("apple", "ggggg")] * 7, [None], [[]], ["apple"]]:
            with self.subTest(guesses=guesses):
                response = self.post(guesses)
                self.assertEqual(response.status_code, 400)
                self.assertIn("error", response.get_json())

    def test_invalid_words(self):
        for word in [None, 5, True, [], {}, "", "four", "longer", "c1gar", "applé", "a p l", "abKde"]:
            with self.subTest(word=word):
                response = self.post([{"word": word, "colors": [GRAY] * 5}])
                self.assertEqual(response.status_code, 400)

    def test_invalid_or_missing_colors(self):
        for colors in [None, "ggggg", [], [GRAY] * 4, [GRAY] * 6,
                       [None] * 5, [[]] * 5, [{}] * 5, [0] * 5, ["unknown"] * 5, ["red"] * 5]:
            with self.subTest(colors=colors):
                response = self.post([{"word": "apple", "colors": colors}])
                self.assertEqual(response.status_code, 400)
        self.assertEqual(self.post([{"word": "apple"}]).status_code, 400)

    def test_invalid_word_list(self):
        for mode in [None, True, 4, "large", "", [], {}]:
            with self.subTest(mode=mode):
                self.assertEqual(self.post([row("apple", "ggggg")], wordList=mode).status_code, 400)

    def test_full_api_normalizes_case_and_outer_whitespace(self):
        with patch.object(solver, "wordle_dictionary", return_value=["APPLE", "apple"]):
            response = self.post([row(" AlLeY ", "gybyb")])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"words": ["apple"], "total": 1})


if __name__ == "__main__":
    unittest.main()

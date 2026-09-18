# WordEngine

Word-game solvers built with Next.js and Flask.

## Weaver solver

Open `/weaver` to find a shortest word ladder between two four- or five-letter
words. Every move substitutes exactly one letter; all words must belong to
WordEngine's bundled `large.txt` dictionary. This dictionary is not guaranteed to
match the word list accepted by the original Weaver game.

The Next.js frontend sends `POST /api/solve` with:

```json
{ "game": "weaver", "data": ["cold", "warm"], "wordLength": 4 }
```

The Flask backend returns `path` (including both endpoints) and `moves` (one less
than the path length). Disconnected valid words return `{"path": [], "moves": null}`;
invalid input or unknown words return HTTP 400. Identical valid words need zero moves.

Start the backend and frontend in separate terminals from the project root:

```bash
python3 -m flask --app src.flask-app.app run --host 127.0.0.1 --port 5001
```

```bash
PYTHON_BACKEND_URL=http://127.0.0.1:5001 npm run dev
```

Install the backend dependencies from `src/flask-app/requirements.txt` in your
Python environment first. `PYTHON_BACKEND_URL` defaults to `http://127.0.0.1:5000`;
port 5001 is useful on macOS, where a system service may already occupy port 5000.
The backend URL is server-only.

Run the solver and API regression tests with:

```bash
python3 -m unittest discover -s tests -v
```

## Letter Boxed solver

Open `/letterboxed` and enter three letters on each of the four sides. The input
order is top, right, bottom, left; each side is read left-to-right or top-to-bottom.
Typing advances to the next tile, and pasting can fill a side or the whole board.

The solver finds exactly two-word solutions. Both words contain at least three
letters and use only board letters; consecutive letters within each word must
come from different sides. The first word's last letter must equal the second
word's first letter, and the pair must cover all 12 letters. Nonconsecutive letter
reuse is allowed. The linking letter is one shared step, not an invalid same-side
move between words.

Request:

```json
{ "game": "letterboxed", "data": ["BKT", "LSH", "AMP", "CIR"] }
```

`POST /api/solve` returns `solutions` (up to 20 ordered pairs, shortest combined
length first, then alphabetically) and `total` (the count of all valid pairs).
All returned pairs solve in two words; total letter count only breaks ties.
An example valid pair is BLACKSMITH → HARP. No match returns
`{"solutions": [], "total": 0}`; malformed sides or duplicate board letters return
HTTP 400. Results use the bundled dictionary, which can differ from NYT's word list.

## Numbword solver

Open `/numbword` and choose a four-, five-, or six-letter word. Enter the target
total, then optionally add letters known to be in the word (blue) and letters
known to be absent (gray). Update these fields as you get clues from each guess.
Clues indicate membership only, never positions or exact occurrence counts.
Repeated clue letters are treated as one requirement; repeated letters in a word
each contribute to its A=1 through Z=26 total (APPLE totals 50).

Request:

```json
{
  "game": "numbword",
  "wordLength": 5,
  "targetScore": 50,
  "presentLetters": "AP",
  "absentLetters": "ST"
}
```

`POST /api/solve` returns `words` (all matching words, alphabetically sorted and
deduplicated) and `total`. The two clue fields are optional strings containing
only A–Z; case and surrounding whitespace are normalized. Length and total must
be integers, with the total between `wordLength` and `26 * wordLength`.
Malformed inputs, conflicting present/absent clues, or more distinct required
letters than word slots return HTTP 400. No match returns `{"words": [], "total": 0}`.
Results use the bundled dictionary, which can differ from Numbword's word list.
The page shows 48 results at a time with an option to reveal more, and displays
each word's letter-by-letter arithmetic.

## Wordle candidate solver

Open `/wordle` to record up to six five-letter guesses. Type or paste words into
the large tiles; use the separate labeled buttons to set each clue to gray,
yellow, or green. With a letter focused, the shortcuts are `0` for gray, `1` for
yellow, and `2` for green. New or changed letters start unmarked so unknown clues
are not silently treated as gray. Adding or removing a row preserves other guesses;
completely empty rows are ignored when searching, but partial rows must be completed.

The solver recreates the feedback for each candidate against every guess: green
matches consume letters first, then yellow matches are allocated left-to-right.
This respects exact positions, excluded positions, and the minimum/maximum counts
implied by duplicate letters. A gray extra copy does not rule out a letter that
also appears green or yellow in that guess.

Request:

```json
{
  "game": "wordle",
  "wordList": "answers",
  "guesses": [
    { "word": "ALLEY", "colors": ["green", "yellow", "gray", "yellow", "gray"] }
  ]
}
```

`POST /api/solve` returns all matching `words` in alphabetical order and `total`.
The page shows 60 candidates at a time, with a button to reveal more. Invalid
inputs (including missing clue colors) return HTTP 400. Inconsistent clues or no
dictionary matches return `{"words": [], "total": 0}`.

`wordList` defaults to `answers`, the bundled `solution_list.txt` answer bank.
`extended` adds `five_letter_words.txt`. These are static dictionaries, not a live
NYT answer list; past answers are deliberately retained. Guesses themselves need
not be in the candidate list, but must contain exactly five ASCII letters.

The same backend setup and unittest command above cover all solvers.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

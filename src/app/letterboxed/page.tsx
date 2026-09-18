"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import GameShell from "../components/game-shell";
import Navbar from "../components/navbar";
import useTileInputs from "../components/use-tile-inputs";
import "./letterboxed.css";

type PairResult = { solutions: [string, string][]; total: number };

const sideNames = ["Top", "Right", "Bottom", "Left"];
const example = "BKTLSHAMPCIR";
const positions = [
  [30, 10],
  [50, 10],
  [70, 10], // Top, left to right
  [90, 30],
  [90, 50],
  [90, 70], // Right, top to bottom
  [30, 90],
  [50, 90],
  [70, 90], // Bottom, left to right
  [10, 30],
  [10, 50],
  [10, 70], // Left, top to bottom
];

export default function LetterBoxed() {
  const [letters, setLetters] = useState<string[]>(() => Array(12).fill(""));
  const [result, setResult] = useState<PairResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => () => activeRequest.current?.abort(), []);

  const clearSearch = () => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setLoading(false);
    setResult(null);
    setError("");
  };

  const reset = () => {
    clearSearch();
    tileInputs.clearError();
    setLetters(Array(12).fill(""));
  };
  const tileInputs = useTileInputs(letters, next => { clearSearch(); setLetters(next); }, { unique: true, rowLength: 3 });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || !tileInputs.complete) return;
    clearSearch();
    tileInputs.clearError();
    if (letters.some((letter) => !/^[A-Z]$/.test(letter))) {
      setError("Fill all 12 tiles with three letters on each side.");
      tileInputs.focus(letters.findIndex((letter) => !letter));
      return;
    }
    if (new Set(letters).size !== 12) {
      setError(
        "Each letter should appear on only one tile. Check for duplicates.",
      );
      return;
    }

    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);

    try {
      const response = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: "letterboxed",
          data: sideNames.map((_, side) =>
            letters.slice(side * 3, side * 3 + 3).join(""),
          ),
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          response.status === 400 && typeof data.error === "string"
            ? data.error
            : "The solver is unavailable right now. Please try again.",
        );
      }
      if (!Array.isArray(data.solutions) || typeof data.total !== "number") {
        throw new Error(
          "The solver returned an unexpected response. Please try again.",
        );
      }
      if (activeRequest.current === controller) setResult(data);
    } catch (problem) {
      if (activeRequest.current === controller && !controller.signal.aborted) {
        setError(
          problem instanceof Error && problem.name !== "TypeError"
            ? problem.message
            : "Could not reach the solver. Check your connection and try again.",
        );
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Navbar
        onRefresh={reset}
        gameUrl="https://www.nytimes.com/puzzles/letter-boxed"
      />
      <GameShell
        index="08"
        title="Letter Boxed"
        description="Twelve letters, four sides, two words. Find a linked pair that uses every letter without taking consecutive letters from the same side."
        steps={[
          "Enter three letters on each side",
          "Find a pair using all 12 letters",
          "Link the last letter to the next word",
        ]}
      >
        <form onSubmit={submit} noValidate className="letterboxed-form">
          <fieldset aria-describedby="letterboxed-hint">
            <legend className="label">Letters on the square</legend>
            <div className="letterboxed-board">
              <div className="letterboxed-square" aria-hidden="true" />
              <span
                className="letterboxed-side-name side-top"
                aria-hidden="true"
              >
                Top
              </span>
              <span
                className="letterboxed-side-name side-right"
                aria-hidden="true"
              >
                Right
              </span>
              <span
                className="letterboxed-side-name side-bottom"
                aria-hidden="true"
              >
                Bottom
              </span>
              <span
                className="letterboxed-side-name side-left"
                aria-hidden="true"
              >
                Left
              </span>
              <div className="letterboxed-center" aria-hidden="true">
                <span>one square</span>
                <em>two words</em>
              </div>
              {letters.map((_, index) => (
                <input
                  key={index}
                  {...tileInputs.bind(index)}
                  className="letterboxed-input"
                  aria-label={`${sideNames[Math.floor(index / 3)]} letter ${(index % 3) + 1}`}
                  style={{
                    left: `${positions[index][0]}%`,
                    top: `${positions[index][1]}%`,
                  }}
                  aria-describedby="letterboxed-hint"
                />
              ))}
            </div>
          </fieldset>
          <p id="letterboxed-hint" className="letterboxed-note">
            Enter or paste the letters: top, right, bottom, then left. Letters
            can be reused within the solution.
          </p>
          <div className="letterboxed-actions">
            <button
              type="button"
              className="letterboxed-example"
              onClick={() => {
                clearSearch();
                tileInputs.clearError();
                setLetters([...example]);
              }}
            >
              Try an example
            </button>
            <button type="submit" className="primary-button" disabled={loading || !tileInputs.complete}>
              {loading ? "Searching…" : "Find two-word solutions →"}
            </button>
          </div>
          {(error || tileInputs.error) && (
            <p className="error-note letterboxed-error" role="alert">
              {tileInputs.error || error}
            </p>
          )}
        </form>

        <div className="letterboxed-status" role="status">
          {loading && (
            <p className="letterboxed-note">
              Checking words and matching pairs…
            </p>
          )}
          {result && (
            <p className="letterboxed-note">
              {result.total === 0
                ? "No two-word solution was found in our dictionary. Check the side assignments; this board may need more than two words."
                : `${result.total} two-word ${result.total === 1 ? "solution" : "solutions"} found. Each pair covers all 12 letters.`}
            </p>
          )}
        </div>

        {result && result.solutions.length > 0 && (
          <section
            className="results"
            aria-labelledby="letterboxed-results-title"
          >
            <div className="letterboxed-results-heading">
              <h2 className="result-heading" id="letterboxed-results-title">
                Two-word solutions
              </h2>
              <span className="eyebrow">12 / 12 letters</span>
            </div>
            <p className="letterboxed-note">
              Shortest combined length first. The highlighted letter links the
              words.
            </p>
            <ol className="letterboxed-pairs">
              {result.solutions.map(([first, second], index) => (
                <li key={`${first}-${second}`} className="letterboxed-pair">
                  <div className="letterboxed-pair-meta">
                    <span>Pair {String(index + 1).padStart(2, "0")}</span>
                    <span>{first.length + second.length} letters</span>
                  </div>
                  <div className="letterboxed-word">
                    <span className="sr-only">First word: </span>
                    {first.slice(0, -1)}
                    <mark>{first.slice(-1)}</mark>
                  </div>
                  <span className="letterboxed-link" aria-hidden="true">
                    ↓
                  </span>
                  <div className="letterboxed-word">
                    <span className="sr-only">Second word: </span>
                    <mark>{second[0]}</mark>
                    {second.slice(1)}
                  </div>
                </li>
              ))}
            </ol>
            {result.total > result.solutions.length && (
              <p className="letterboxed-note">
                Showing the {result.solutions.length} shortest pairs of{" "}
                {result.total}.
              </p>
            )}
          </section>
        )}

        <p className="letterboxed-note letterboxed-dictionary">
          Words must be at least three letters long. Solutions use WordEngine’s
          dictionary; accepted words may differ from the NYT game.
        </p>
      </GameShell>
    </>
  );
}

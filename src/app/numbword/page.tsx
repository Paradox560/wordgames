"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import GameShell from "../components/game-shell";
import Navbar from "../components/navbar";
import { numbwordComplete } from "../lib/tile-input";
import "./numbword.css";

type WordLength = 4 | 5 | 6;
type Candidates = { words: string[]; total: number };

const examples = {
  4: { total: "34", present: "CL", absent: "WR" },
  5: { total: "50", present: "AP", absent: "ST" },
  6: { total: "68", present: "PN", absent: "SR" },
} as const;
const pageSize = 48;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const letterValue = (letter: string) => letter.toUpperCase().charCodeAt(0) - 64;

export default function Numbword() {
  const [wordLength, setWordLength] = useState<WordLength>(5);
  const [targetScore, setTargetScore] = useState("");
  const [presentLetters, setPresentLetters] = useState("");
  const [absentLetters, setAbsentLetters] = useState("");
  const [result, setResult] = useState<Candidates | null>(null);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);
  const targetInput = useRef<HTMLInputElement>(null);
  const presentInput = useRef<HTMLInputElement>(null);
  const absentInput = useRef<HTMLInputElement>(null);
  const canSubmit = numbwordComplete(wordLength, targetScore, presentLetters, absentLetters);

  useEffect(() => () => activeRequest.current?.abort(), []);

  const clearSearch = () => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setLoading(false);
    setResult(null);
    setVisibleCount(pageSize);
    setError("");
  };

  const reset = () => {
    clearSearch();
    setTargetScore("");
    setPresentLetters("");
    setAbsentLetters("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || !canSubmit) return;
    clearSearch();
    const score = Number(targetScore);
    if (
      !/^\d+$/.test(targetScore.trim()) ||
      !Number.isInteger(score) ||
      score < wordLength ||
      score > wordLength * 26
    ) {
      setError(
        `Enter a whole-number target total from ${wordLength} to ${wordLength * 26}.`,
      );
      targetInput.current?.focus();
      return;
    }

    const present = presentLetters.trim().toUpperCase();
    const absent = absentLetters.trim().toUpperCase();
    if (!/^[A-Z]*$/.test(present) || !/^[A-Z]*$/.test(absent)) {
      setError(
        "Enter clue letters using only A–Z, without spaces or punctuation.",
      );
      (!/^[A-Z]*$/.test(present) ? presentInput : absentInput).current?.focus();
      return;
    }
    const required = new Set(present);
    const overlap = [...required].filter((letter) => absent.includes(letter));
    if (overlap.length > 0) {
      setError(
        `A letter cannot be both present and absent: ${overlap.join(", ")}.`,
      );
      absentInput.current?.focus();
      return;
    }
    if (required.size > wordLength) {
      setError(
        `A ${wordLength}-letter word cannot contain ${required.size} different required letters.`,
      );
      presentInput.current?.focus();
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
          game: "numbword",
          wordLength,
          targetScore: score,
          presentLetters: present,
          absentLetters: absent,
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
      if (
        !Array.isArray(data.words) ||
        !data.words.every((word: unknown) => typeof word === "string") ||
        data.total !== data.words.length
      ) {
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
      <Navbar onRefresh={reset} gameUrl="https://numbword.com/" />
      <GameShell
        index="09"
        title="Numbword"
        description="A little arithmetic, a little deduction. Find words that add up to your total and fit the letters you know."
        steps={[
          "Choose a length and target total",
          "Add the letter clues from your guesses",
          "Narrow down the possible words",
        ]}
      >
        <form className="numbword-form" onSubmit={submit} noValidate>
          <div className="numbword-puzzle">
            <fieldset>
              <legend className="label">Word length</legend>
              <div className="numbword-modes">
                {([4, 5, 6] as const).map((length) => (
                  <label key={length} className="numbword-mode">
                    <input
                      type="radio"
                      name="word-length"
                      value={length}
                      checked={wordLength === length}
                      onChange={() => {
                        reset();
                        setWordLength(length);
                      }}
                    />
                    <span>{length} letters</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label className="label" htmlFor="numbword-total">
                Target total
              </label>
              <input
                ref={targetInput}
                id="numbword-total"
                className="field numbword-total"
                type="number"
                inputMode="numeric"
                min={wordLength}
                max={wordLength * 26}
                step="1"
                value={targetScore}
                placeholder={examples[wordLength].total}
                onChange={(event) => {
                  clearSearch();
                  setTargetScore(event.target.value);
                }}
                aria-describedby="numbword-total-hint"
                required
              />
              <p id="numbword-total-hint" className="numbword-note">
                A = 1 · Z = 26. Total: {wordLength}–{26 * wordLength}.
              </p>
            </div>
          </div>

          <fieldset className="numbword-clues">
            <legend className="label">What you know</legend>
            <p id="numbword-clue-hint" className="numbword-note">
              Add letters from any guesses. Leave blank to search by total
              alone.
            </p>
            <div className="numbword-clue-fields">
              <div>
                <label
                  className="numbword-clue-label"
                  htmlFor="numbword-present"
                >
                  <span
                    className="numbword-clue-dot numbword-present-dot"
                    aria-hidden="true"
                  />
                  In the word <span className="numbword-note">(blue)</span>
                </label>
                <input
                  ref={presentInput}
                  id="numbword-present"
                  className="field numbword-letters"
                  value={presentLetters}
                  onChange={(event) => {
                    clearSearch();
                    setPresentLetters(event.target.value.toUpperCase());
                  }}
                  placeholder="e.g. AP"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  aria-describedby="numbword-clue-hint numbword-presence-hint"
                />
              </div>
              <div>
                <label
                  className="numbword-clue-label"
                  htmlFor="numbword-absent"
                >
                  <span
                    className="numbword-clue-dot numbword-absent-dot"
                    aria-hidden="true"
                  />
                  Not in the word <span className="numbword-note">(gray)</span>
                </label>
                <input
                  ref={absentInput}
                  id="numbword-absent"
                  className="field numbword-letters"
                  value={absentLetters}
                  onChange={(event) => {
                    clearSearch();
                    setAbsentLetters(event.target.value.toUpperCase());
                  }}
                  placeholder="e.g. ST"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  aria-describedby="numbword-clue-hint numbword-presence-hint"
                />
              </div>
            </div>
            <p id="numbword-presence-hint" className="numbword-note">
              Letters can be anywhere. A blue clue means at least one copy, not
              a fixed position or an exact count. Use A–Z only, with no letter in both fields and at most {wordLength} different blue letters.
            </p>
          </fieldset>

          <details className="numbword-reference">
            <summary>
              Letter values <span className="numbword-note">A–Z</span>
            </summary>
            <div className="numbword-alphabet">
              {[...alphabet].map((letter) => (
                <span key={letter}>
                  <b>{letter}</b>
                  <span>{letterValue(letter)}</span>
                </span>
              ))}
            </div>
            <p className="numbword-note">
              Count repeated letters each time: APPLE = 1 + 16 + 16 + 12 + 5 =
              50.
            </p>
          </details>

          <div className="numbword-actions">
            <button
              type="button"
              className="numbword-text-button"
              onClick={() => {
                clearSearch();
                const example = examples[wordLength];
                setTargetScore(example.total);
                setPresentLetters(example.present);
                setAbsentLetters(example.absent);
              }}
            >
              Try an example
            </button>
            <button type="submit" className="primary-button" disabled={loading || !canSubmit}>
              {loading ? "Searching…" : "Find possible words →"}
            </button>
          </div>
          {error && (
            <p role="alert" className="error-note numbword-error">
              {error}
            </p>
          )}
        </form>

        <div role="status" className="numbword-status">
          {loading && (
            <p className="numbword-note">Checking letter totals and clues…</p>
          )}
          {result && (
            <p className="numbword-note">
              {result.total === 0
                ? "No words match in our dictionary. Check the total and your letter clues, or clear a clue to broaden the search."
                : `${result.total} possible ${result.total === 1 ? "word" : "words"}. Every result has ${wordLength} letters and adds up to ${targetScore}.`}
            </p>
          )}
        </div>

        {result && result.total > 0 && (
          <section
            className="results numbword-results"
            aria-labelledby="numbword-results-title"
          >
            <div className="numbword-results-heading">
              <h2 className="result-heading" id="numbword-results-title">
                Possible words
              </h2>
              <span className="eyebrow">Total {targetScore}</span>
            </div>
            <p className="numbword-note">
              Alphabetical order. Add clues after your next guess to narrow this
              list.
            </p>
            <ul className="numbword-candidates">
              {result.words.slice(0, visibleCount).map((word) => (
                <li key={word}>
                  <span className="numbword-candidate-word">{word}</span>
                  <span
                    className="numbword-equation"
                    aria-label={`Letter values: ${[...word].map(letterValue).join(" plus ")} equals ${targetScore}`}
                  >
                    {[...word].map(letterValue).join(" + ")} = {targetScore}
                  </span>
                </li>
              ))}
            </ul>
            {visibleCount < result.total && (
              <div className="numbword-more">
                <p className="numbword-note" role="status">
                  Showing {Math.min(visibleCount, result.total)} of{" "}
                  {result.total}
                </p>
                <button
                  type="button"
                  className="numbword-text-button"
                  onClick={() => setVisibleCount((count) => count + pageSize)}
                >
                  Show {Math.min(pageSize, result.total - visibleCount)} more ↓
                </button>
              </div>
            )}
          </section>
        )}

        <p className="numbword-note numbword-dictionary">
          Results use WordEngine’s dictionary. Accepted words may differ from
          Numbword.
        </p>
      </GameShell>
    </>
  );
}

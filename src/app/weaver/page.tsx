"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import GameShell from "../components/game-shell";
import Navbar from "../components/navbar";

type WordLength = 4 | 5;
type Ladder = { path: string[]; moves: number | null };

const examples = { 4: ["COLD", "WARM"], 5: ["STONE", "SHORE"] } as const;

export default function Weaver() {
  const [wordLength, setWordLength] = useState<WordLength>(4);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [result, setResult] = useState<Ladder | null>(null);
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
    setStart("");
    setEnd("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearSearch();
    const validWord = new RegExp(`^[a-zA-Z]{${wordLength}}$`);
    if (!validWord.test(start.trim()) || !validWord.test(end.trim())) {
      setError(`Enter two ${wordLength}-letter words using A–Z.`);
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
          game: "weaver",
          data: [start.trim(), end.trim()],
          wordLength,
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
      if (!Array.isArray(data.path)) {
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
        gameUrl="https://wordwormdormdork.com/weaver/"
      />
      <GameShell
        index="07"
        title="Weaver"
        description="Get from one word to another, one letter at a time. Find a shortest route through valid words."
        steps={[
          "Choose four or five letters",
          "Enter the start and end words",
          "Follow the shortest ladder",
        ]}
      >
        <form onSubmit={submit} noValidate className="weaver-form">
          <fieldset>
            <legend className="label">Word length</legend>
            <div className="weaver-modes">
              {([4, 5] as const).map((length) => (
                <label key={length} className="weaver-mode">
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

          <div className="weaver-endpoints">
            <div>
              <label className="label" htmlFor="weaver-start">
                Start word
              </label>
              <input
                id="weaver-start"
                className="field weaver-word-field"
                value={start}
                onChange={(event) => {
                  clearSearch();
                  setStart(event.target.value.toUpperCase());
                }}
                placeholder={examples[wordLength][0]}
                maxLength={wordLength}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-describedby="weaver-input-hint"
              />
            </div>
            <div>
              <label className="label" htmlFor="weaver-end">
                End word
              </label>
              <input
                id="weaver-end"
                className="field weaver-word-field"
                value={end}
                onChange={(event) => {
                  clearSearch();
                  setEnd(event.target.value.toUpperCase());
                }}
                placeholder={examples[wordLength][1]}
                maxLength={wordLength}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-describedby="weaver-input-hint"
              />
            </div>
          </div>
          <p id="weaver-input-hint" className="weaver-note">
            Each step changes one letter. Words stay the same length.
          </p>

          <div className="weaver-actions">
            <button
              type="button"
              className="weaver-example"
              onClick={() => {
                clearSearch();
                setStart(examples[wordLength][0]);
                setEnd(examples[wordLength][1]);
              }}
            >
              Try an example
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Searching…" : "Find shortest path →"}
            </button>
          </div>
          {error && (
            <p role="alert" className="error-note weaver-error">
              {error}
            </p>
          )}
        </form>

        <div role="status" className="weaver-status">
          {loading && (
            <p className="weaver-note">
              Looking for the fewest letter changes…
            </p>
          )}
          {result &&
            (result.path.length === 0 ? (
              <p className="weaver-note">
                No path connects these words in our dictionary. Try a different
                pair.
              </p>
            ) : (
              <p className="weaver-note">
                {result.moves === 0
                  ? "These words are the same. No changes needed."
                  : `Shortest path found: ${result.moves} ${result.moves === 1 ? "move" : "moves"}.`}
              </p>
            ))}
        </div>

        {result && result.path.length > 0 && (
          <section
            className="results weaver-results"
            aria-labelledby="ladder-title"
          >
            <div className="weaver-results-heading">
              <h2 id="ladder-title" className="result-heading">
                Shortest ladder
              </h2>
              <span className="eyebrow">
                {result.moves} {result.moves === 1 ? "move" : "moves"}
              </span>
            </div>
            <ol className="weaver-ladder">
              {result.path.map((word, step) => {
                const previous = result.path[step - 1];
                const changedIndex = previous
                  ? [...word].findIndex((letter, i) => letter !== previous[i])
                  : -1;
                const last = step === result.path.length - 1;
                const label =
                  step === 0
                    ? last
                      ? "Start / End"
                      : "Start"
                    : last
                      ? "End"
                      : `Step ${step}`;
                return (
                  <li key={word} className="weaver-rung">
                    <span className="sr-only">
                      {label}: {word.toUpperCase()}
                      {previous &&
                        `, change ${previous[changedIndex].toUpperCase()} to ${word[changedIndex].toUpperCase()}`}
                    </span>
                    <span aria-hidden="true" className="weaver-rung-label">
                      {label}
                    </span>
                    <div aria-hidden="true" className="weaver-tiles">
                      {[...word].map((letter, i) => (
                        <span
                          key={i}
                          className={`weaver-tile${i === changedIndex ? " weaver-tile-changed" : ""}`}
                        >
                          {letter}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>
            {result.moves !== 0 && (
              <p className="weaver-note">
                Highlighted tiles show the changed letter. Other equally short
                paths may exist.
              </p>
            )}
          </section>
        )}

        <p className="weaver-note weaver-dictionary">
          Paths use WordEngine’s dictionary. Accepted words may differ from
          Weaver.
        </p>
      </GameShell>
    </>
  );
}

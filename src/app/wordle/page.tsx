"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Navbar from "../components/navbar";
import GameShell from "../components/game-shell";
import "./wordle.css";

type Clue = "unknown" | "gray" | "yellow" | "green";
type GuessRow = { id: number; letters: string[]; colors: Clue[] };
type Candidates = { words: string[]; total: number };

const clueOrder: Clue[] = ["unknown", "gray", "yellow", "green"];
const clueNames = { unknown: "Set", gray: "Gray", yellow: "Yellow", green: "Green" };
const blankRow = (id: number): GuessRow => ({ id, letters: Array(5).fill(""), colors: Array(5).fill("unknown") });
const pageSize = 60;

export default function Wordle() {
  const [rows, setRows] = useState<GuessRow[]>([blankRow(0)]);
  const [wordList, setWordList] = useState<"answers" | "extended">("answers");
  const [result, setResult] = useState<Candidates | null>(null);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nextRowId = useRef(1);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const clueButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => () => activeRequest.current?.abort(), []);

  const clearSearch = () => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setLoading(false); setResult(null); setVisibleCount(pageSize); setError("");
  };
  const reset = () => {
    clearSearch();
    setRows([blankRow(nextRowId.current++)]);
  };
  const focusTile = (id: number, column: number) => inputs.current[`${id}-${column}`]?.focus();

  const setLetter = (id: number, column: number, value: string) => {
    if (value && !/^[a-zA-Z]$/.test(value)) return;
    clearSearch();
    const letter = value.toUpperCase();
    setRows(old => old.map(row => row.id !== id ? row : {
      ...row,
      letters: row.letters.map((item, i) => i === column ? letter : item),
      colors: row.colors.map((color, i) => i === column && row.letters[i] !== letter ? "unknown" : color),
    }));
    if (letter && column < 4) focusTile(id, column + 1);
  };
  const setClue = (id: number, column: number, color: Clue) => {
    clearSearch();
    setRows(old => old.map(row => row.id !== id ? row : {
      ...row, colors: row.colors.map((item, i) => i === column ? color : item),
    }));
  };
  const handleKey = (event: KeyboardEvent<HTMLInputElement>, row: GuessRow, column: number) => {
    const shortcuts: Record<string, Clue> = { "0": "gray", "1": "yellow", "2": "green" };
    if (shortcuts[event.key]) {
      event.preventDefault();
      if (row.letters[column]) setClue(row.id, column, shortcuts[event.key]);
    } else if ((event.key === "Backspace" && !row.letters[column]) || event.key === "ArrowLeft") {
      if (column > 0) { event.preventDefault(); focusTile(row.id, column - 1); }
    } else if (event.key === "ArrowRight" && column < 4) {
      event.preventDefault(); focusTile(row.id, column + 1);
    }
  };
  const addRow = () => {
    if (rows.length === 6) return;
    clearSearch();
    const row = blankRow(nextRowId.current++);
    setRows(old => [...old, row]);
    requestAnimationFrame(() => focusTile(row.id, 0));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearSearch();
    const guesses = [];
    for (const [index, row] of rows.entries()) {
      if (row.letters.every(letter => !letter)) continue;
      const empty = row.letters.findIndex(letter => !letter);
      if (empty !== -1) {
        setError(`Finish the five letters in guess ${index + 1}, or remove that row.`);
        focusTile(row.id, empty);
        return;
      }
      const unmarked = row.colors.indexOf("unknown");
      if (unmarked !== -1) {
        setError(`Set all five clue colors in guess ${index + 1}. Gray is a clue too.`);
        clueButtons.current[`${row.id}-${unmarked}`]?.focus();
        return;
      }
      guesses.push({ word: row.letters.join(""), colors: row.colors });
    }
    if (!guesses.length) {
      setError("Enter at least one five-letter guess and mark its clue colors.");
      focusTile(rows[0].id, 0);
      return;
    }

    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    try {
      const response = await fetch("/api/solve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "wordle", guesses, wordList }), signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(response.status === 400 && typeof data.error === "string"
          ? data.error : "The solver is unavailable right now. Please try again.");
      }
      if (!Array.isArray(data.words) || !data.words.every((word: unknown) => typeof word === "string")
        || data.total !== data.words.length) {
        throw new Error("The solver returned an unexpected response. Please try again.");
      }
      if (activeRequest.current === controller) setResult(data);
    } catch (problem) {
      if (activeRequest.current === controller && !controller.signal.aborted) {
        setError(problem instanceof Error && problem.name !== "TypeError"
          ? problem.message : "Could not reach the solver. Check your connection and try again.");
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  };

  return <>
    <Navbar onRefresh={reset} gameUrl="https://www.nytimes.com/games/wordle/index.html" />
    <GameShell index="04" title="Wordle"
      description="Every tile tells you something. Match your guesses and their colors to find the words still in play."
      steps={["Enter the guesses from your board", "Mark each tile gray, yellow, or green", "Find candidates that fit every clue"]}>
      <form className="wordle-form" onSubmit={submit} noValidate>
        <div className="wordle-board-heading">
          <h2 className="label">Your guesses</h2>
          <span className="wordle-note">{rows.length} / 6 rows</span>
        </div>
        <p className="wordle-note" id="wordle-input-hint">Type or paste a guess into the large tiles. The buttons below change colors; clicking a letter only edits it.</p>
        <div className="wordle-board">
          {rows.map((row, rowIndex) => <fieldset key={row.id} className="wordle-row">
            <legend className="sr-only">Guess {rowIndex + 1}</legend>
            <div className="wordle-row-heading">
              <span className="wordle-row-number" aria-hidden="true">Guess {String(rowIndex + 1).padStart(2, "0")}</span>
              <div className="wordle-row-actions">
                <button type="button" className="wordle-text-button" disabled={row.letters.some(letter => !letter)}
                  aria-label={`Mark all letters in guess ${rowIndex + 1} gray`}
                  onClick={() => {
                    clearSearch();
                    setRows(old => old.map(item => item.id === row.id ? { ...item, colors: Array(5).fill("gray") } : item));
                  }}>All gray</button>
                {rows.length > 1 && <button type="button" className="wordle-text-button"
                  aria-label={`Remove guess ${rowIndex + 1}`} onClick={() => {
                    clearSearch(); setRows(old => old.filter(item => item.id !== row.id));
                  }}>Remove</button>}
              </div>
            </div>
            <div className="wordle-tiles">
              {row.letters.map((letter, column) => {
                const color = row.colors[column];
                const nextColor = clueOrder[(clueOrder.indexOf(color) + 1) % clueOrder.length];
                const key = `${row.id}-${column}`;
                return <div key={column} className="wordle-tile-group">
                  <input ref={element => { inputs.current[key] = element; }}
                    aria-label={`Guess ${rowIndex + 1}, letter ${column + 1}`}
                    aria-describedby="wordle-input-hint wordle-color-hint"
                    className={`wordle-tile wordle-${color}`} value={letter} maxLength={1}
                    autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck={false}
                    onFocus={event => event.currentTarget.select()}
                    onChange={event => setLetter(row.id, column, event.target.value)}
                    onKeyDown={event => handleKey(event, row, column)}
                    onPaste={event => {
                      event.preventDefault();
                      const text = event.clipboardData.getData("text").trim();
                      if (!/^[a-zA-Z]{1,5}$/.test(text)) {
                        setError("Paste one word of up to five letters (A–Z).");
                        return;
                      }
                      const start = text.length === 5 ? 0 : column;
                      if (start + text.length > 5) {
                        setError("That text will not fit. Paste a full five-letter word or start at an earlier tile.");
                        return;
                      }
                      clearSearch();
                      const pasted = text.toUpperCase();
                      setRows(old => old.map(item => item.id !== row.id ? item : {
                        ...item,
                        letters: item.letters.map((value, i) => i >= start && i < start + pasted.length ? pasted[i - start] : value),
                        colors: item.colors.map((value, i) => i >= start && i < start + pasted.length && item.letters[i] !== pasted[i - start] ? "unknown" : value),
                      }));
                      focusTile(row.id, Math.min(start + pasted.length, 4));
                    }} />
                  <button type="button" ref={element => { clueButtons.current[key] = element; }}
                    disabled={!letter} className={`wordle-color-button wordle-${color}`}
                    aria-label={`Guess ${rowIndex + 1}, letter ${column + 1}${letter ? ` (${letter})` : ""}: ${color === "unknown" ? "color not set" : color}. Change to ${nextColor === "unknown" ? "not set" : nextColor}.`}
                    onClick={() => setClue(row.id, column, nextColor)}>{clueNames[color]}</button>
                </div>;
              })}
            </div>
          </fieldset>)}
        </div>
        <div className="wordle-board-actions">
          <button type="button" className="wordle-add-button" onClick={addRow} disabled={rows.length === 6}>+ Add guess</button>
          <button type="button" className="wordle-text-button" onClick={() => {
            clearSearch();
            setRows([{ id: nextRowId.current++, letters: [..."ALLEY"], colors: ["green", "yellow", "gray", "yellow", "gray"] }]);
          }}>Try an example</button>
        </div>
        <div className="wordle-legend" aria-label="Clue meanings">
          <span><i className="wordle-gray" aria-hidden="true" />Gray: absent or extra copy</span>
          <span><i className="wordle-yellow" aria-hidden="true" />Yellow: wrong spot</span>
          <span><i className="wordle-green" aria-hidden="true" />Green: correct spot</span>
        </div>
        <p className="wordle-note" id="wordle-color-hint">Buttons cycle Set → Gray → Yellow → Green. Keyboard shortcuts on a letter: 0 gray, 1 yellow, 2 green. Changing a letter resets that tile’s clue.</p>
        <div className="wordle-search-options">
          <div>
            <label className="label" htmlFor="wordle-list">Word list</label>
            <select id="wordle-list" className="field" value={wordList}
              onChange={event => { clearSearch(); setWordList(event.target.value as "answers" | "extended"); }}
              aria-describedby="wordle-dictionary-hint">
              <option value="answers">Answer list</option>
              <option value="extended">Extended word list</option>
            </select>
          </div>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Searching…" : "Find candidates →"}
          </button>
        </div>
        {error && <p role="alert" className="error-note wordle-error">{error}</p>}
      </form>
      <div role="status" className="wordle-status">
        {loading && <p className="wordle-note">Checking every candidate against your board…</p>}
        {result && <p className="wordle-note">{result.total === 0
          ? `No candidates match all your clues in this list. Check the colors, especially repeated letters.${wordList === "answers" ? " You can also try the extended word list." : ""}`
          : `${result.total} ${result.total === 1 ? "candidate matches" : "candidates match"} every completed guess.`}</p>}
      </div>
      {result && result.total > 0 && <section className="results" aria-labelledby="wordle-results-title">
        <div className="wordle-results-heading">
          <h2 className="result-heading" id="wordle-results-title">Possible answers</h2>
          <span className="eyebrow">{result.total} {result.total === 1 ? "word" : "words"}</span>
        </div>
        <p className="wordle-note">Alphabetical order. Add your next guess to narrow the list.</p>
        <ul className="word-grid">
          {result.words.slice(0, visibleCount).map(word => <li key={word} className="word-chip">{word}</li>)}
        </ul>
        <div className="wordle-more" role="status">
          {result.total > pageSize && <p className="wordle-note">Showing {Math.min(visibleCount, result.total)} of {result.total}</p>}
          {visibleCount < result.total && <button type="button" className="wordle-text-button"
            onClick={() => setVisibleCount(count => count + pageSize)}>Show {Math.min(pageSize, result.total - visibleCount)} more ↓</button>}
        </div>
      </section>}
      <p id="wordle-dictionary-hint" className="wordle-note wordle-dictionary">The answer list is a bundled Wordle answer bank; the extended list adds more five-letter words. Neither is a live NYT list. Past answers are kept, and acceptance may differ from today’s game.</p>
    </GameShell>
  </>;
}

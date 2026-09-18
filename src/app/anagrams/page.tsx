"use client";

import { useState } from "react";
import GameShell from "../components/game-shell";
import Navbar from "../components/navbar";
import WordResults from "../components/word-results";
import useTileInputs from "../components/use-tile-inputs";
import useLetterSolver from "../components/use-letter-solver";

export default function Anagrams() {
  const [count, setCount] = useState(6);
  const [letters, setLetters] = useState<string[]>(Array(6).fill(""));
  const solver = useLetterSolver<Record<number, string[]>>("anagrams");
  const inputs = useTileInputs(letters, next => { solver.clear(); setLetters(next); });
  const reset = (nextCount = count) => {
    solver.clear(); inputs.clearError(); setCount(nextCount); setLetters(Array(nextCount).fill(""));
  };

  return <>
    <Navbar onRefresh={() => reset()} gameUrl="https://www.pogo.com/games/anagrams" />
    <GameShell index="03" title="Anagrams" description="Lay out your rack exactly as it appears. We’ll shake loose every word those letters can make.">
      {(inputs.error || solver.error) && <p className="error-note" role="alert">{inputs.error || solver.error}</p>}
      <form onSubmit={event => { event.preventDefault(); if (inputs.complete && !solver.loading) void solver.solve(letters); }}>
        <label className="label" htmlFor="letter-count">Letters on the rack</label>
        <select id="letter-count" className="field mb-8" value={count} onChange={event => reset(Number(event.target.value))}>
          {[6, 7, 8].map(number => <option key={number} value={number}>{number} letters</option>)}
        </select>
        <div className="flex justify-center gap-2 border-y border-[#c9c0ae] bg-[#e8dfcd]/45 px-3 py-8">
          {letters.map((_, index) => <input key={index} {...inputs.bind(index)} aria-label={`Letter ${index + 1}`} aria-describedby="anagrams-entry-hint" className="tile-input" />)}
        </div>
        <p id="anagrams-entry-hint" className="input-hint mt-4">Fill all {count} tiles, or paste the entire rack. Repeated letters are allowed.</p>
        <div className="mt-8 flex justify-end"><button type="submit" className="primary-button" disabled={!inputs.complete || solver.loading}>{solver.loading ? "Searching…" : "Rearrange the rack →"}</button></div>
      </form>
      <WordResults result={solver.result} />
    </GameShell>
  </>;
}

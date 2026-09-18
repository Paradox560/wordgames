"use client";

import { useState } from "react";
import GameShell from "../components/game-shell";
import Navbar from "../components/navbar";
import useTileInputs from "../components/use-tile-inputs";
import useLetterSolver from "../components/use-letter-solver";

export default function Quartiles() {
  const [letters, setLetters] = useState<string[]>(Array(20).fill(""));
  const solver = useLetterSolver<string[][]>("quartiles");
  const inputs = useTileInputs(letters, next => { solver.clear(); setLetters(next); }, { maxLength: 5, rowLength: 4 });
  const reset = () => { solver.clear(); inputs.clearError(); setLetters(Array(20).fill("")); };

  return <>
    <Navbar onRefresh={reset} gameUrl="https://support.apple.com/guide/iphone/solve-quartiles-puzzles-iph9ccdd1bab/ios" />
    <GameShell index="06" title="Quartiles" description="Transcribe each fragment in reading order. Then combine the little pieces into complete words.">
      {(inputs.error || solver.error) && <p className="error-note" role="alert">{inputs.error || solver.error}</p>}
      <form onSubmit={event => { event.preventDefault(); if (inputs.complete && !solver.loading) void solver.solve(letters); }}>
        <div className="mx-auto grid w-fit grid-cols-4 gap-2 border border-[#c9c0ae] bg-[#e8dfcd]/55 p-4">
          {letters.map((_, index) => <input key={index} {...inputs.bind(index)} aria-label={`Fragment row ${Math.floor(index / 4) + 1}, column ${index % 4 + 1}`} aria-describedby="quartiles-entry-hint" className="h-14 w-24 border border-[#a59c89] bg-[#fffdf7] px-1 text-center font-mono text-sm font-bold lowercase shadow-[2px_3px_0_rgba(73,60,39,.14)] outline-none focus:border-[#234d3c] focus:ring-2 focus:ring-[#234d3c]/20" />)}
        </div>
        <p id="quartiles-entry-hint" className="input-hint mt-4">Fill all 20 fragments. Paste a row or full board with spaces between fragments. Use Tab or Space to advance after a short fragment; five letters advance automatically.</p>
        <div className="mt-8 flex justify-end"><button type="submit" className="primary-button" disabled={!inputs.complete || solver.loading}>{solver.loading ? "Searching…" : "Assemble words →"}</button></div>
      </form>
      {solver.result && solver.result.length > 0 && <div className="results"><h2 className="result-heading">Complete words</h2><div className="mt-4 grid gap-2">{solver.result.map((words, index) => <div key={index} className="word-chip text-left">{words.join(" + ")}</div>)}</div></div>}
    </GameShell>
  </>;
}

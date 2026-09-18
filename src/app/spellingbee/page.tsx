"use client";

import { useState } from "react";
import GameShell from "../components/game-shell";
import Navbar from "../components/navbar";
import WordResults from "../components/word-results";
import useTileInputs from "../components/use-tile-inputs";
import useLetterSolver from "../components/use-letter-solver";

const positions = ["left-1/2 top-1/2", "left-1/2 top-[19%]", "left-[73%] top-[34%]", "left-[73%] top-[66%]", "left-1/2 top-[81%]", "left-[27%] top-[66%]", "left-[27%] top-[34%]"];

export default function SpellingBee() {
  const [letters, setLetters] = useState<string[]>(Array(7).fill(""));
  const solver = useLetterSolver<Record<number, string[]>>("spellingbee");
  const inputs = useTileInputs(letters, next => { solver.clear(); setLetters(next); }, { unique: true });
  const reset = () => { solver.clear(); inputs.clearError(); setLetters(Array(7).fill("")); };

  return <>
    <Navbar onRefresh={reset} gameUrl="https://www.nytimes.com/puzzles/spelling-bee" />
    <GameShell index="01" title="Spelling Bee" description="Put the required letter in the gold center cell, then add the six letters that surround it.">
      {(inputs.error || solver.error) && <p className="error-note" role="alert">{inputs.error || solver.error}</p>}
      <form onSubmit={event => { event.preventDefault(); if (inputs.complete && !solver.loading) void solver.solve(letters); }}>
        <div className="relative mx-auto h-[300px] w-[300px]">{positions.map((position, index) => <input key={index} {...inputs.bind(index)} aria-label={index === 0 ? "Required center letter" : `Outer letter ${index}`} aria-describedby="bee-entry-hint" className={`absolute h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 text-center text-2xl font-black uppercase outline-none focus:ring-4 focus:ring-inset focus:ring-[#234d3c] drop-shadow-[0_2px_1px_rgba(29,33,29,.28)] ${position} ${index === 0 ? "bg-[#e2ad3b] text-[#1d211d]" : "bg-[#d8cdb6] text-[#1d211d]"}`} style={{ clipPath: "polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)" }} />)}</div>
        <p id="bee-entry-hint" className="input-hint">Enter seven unique letters. Paste the center letter first, then the outer letters clockwise from the top.</p>
        <div className="mt-8 flex justify-end"><button type="submit" className="primary-button" disabled={!inputs.complete || solver.loading}>{solver.loading ? "Searching…" : "Find the words →"}</button></div>
      </form>
      <WordResults result={solver.result} />
    </GameShell>
  </>;
}

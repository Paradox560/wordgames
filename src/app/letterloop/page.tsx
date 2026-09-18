"use client";

import { useState } from "react";
import Navbar from "../components/navbar";
import GameShell from "../components/game-shell";
import useTileInputs from "../components/use-tile-inputs";
import useLetterSolver from "../components/use-letter-solver";

const positions = ["left-1/2 top-[6%]", "left-[81%] top-[20%]", "left-[94%] top-1/2", "left-[81%] top-[80%]", "left-1/2 top-[94%]", "left-[19%] top-[80%]", "left-[6%] top-1/2", "left-[19%] top-[20%]"];

export default function LetterLoop() {
  const [letters, setLetters] = useState<string[]>(Array(8).fill(""));
  const solver = useLetterSolver<[string, string][]>("letterloop");
  const inputs = useTileInputs(letters, next => { solver.clear(); setLetters(next); });
  const clear = () => { solver.clear(); inputs.clearError(); setLetters(Array(8).fill("")); };
  return <>
    <Navbar onRefresh={clear} gameUrl="https://www.theletterloop.com/" />
    <GameShell index="05" title="Letter Loop" description="Enter the eight letters clockwise from the top. Find two words that use the whole loop between them.">
      {(inputs.error || solver.error) && <p className="error-note" role="alert">{inputs.error || solver.error}</p>}
      <form onSubmit={event => { event.preventDefault(); if (inputs.complete && !solver.loading) void solver.solve(letters); }}>
        <div className="relative mx-auto h-[350px] w-[350px] rounded-full border border-dashed border-[#a59c89]">
          <div className="wordmark absolute inset-0 grid place-items-center text-center text-xl italic text-[#68685f]">two words<br />one loop</div>
          {letters.map((_, index) => <input key={index} {...inputs.bind(index)} aria-label={`Loop letter ${index + 1}`} aria-describedby="loop-entry-hint" className={`tile-input absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${positions[index]}`} />)}
        </div>
        <p id="loop-entry-hint" className="input-hint mt-6">Fill all eight letters, or paste the whole loop clockwise from the top.</p>
        <div className="mt-8 flex justify-end"><button type="submit" className="primary-button" disabled={!inputs.complete || solver.loading}>{solver.loading ? "Searching…" : "Close the loop →"}</button></div>
      </form>
      {solver.result && solver.result.length > 0 && <div className="results"><h2 className="result-heading">Pairs that fit</h2><div className="mt-4 grid gap-2">{solver.result.map(([a, b]) => <div key={`${a}-${b}`} className="flex items-center justify-center gap-3 border border-[#d3c9b8] bg-[#fffdf7] p-3 font-mono uppercase"><span>{a}</span><span className="text-[#b75333]">+</span><span>{b}</span></div>)}</div></div>}
    </GameShell>
  </>;
}

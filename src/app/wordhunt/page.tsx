"use client";

import { useState } from "react";
import GameShell from "../components/game-shell";
import Navbar from "../components/navbar";
import WordResults from "../components/word-results";
import useTileInputs from "../components/use-tile-inputs";
import useLetterSolver from "../components/use-letter-solver";

type GridSize = 3 | 4 | 5;

export default function WordHunt() {
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [letters, setLetters] = useState<string[]>(Array(16).fill(""));
  const solver = useLetterSolver<Record<number, string[]>>("wordhunt");
  const inputs = useTileInputs(letters, next => { solver.clear(); setLetters(next); }, { rowLength: gridSize });
  const reset = (size = gridSize) => {
    solver.clear(); inputs.clearError(); setGridSize(size); setLetters(Array(size * size).fill(""));
  };

  return <>
    <Navbar onRefresh={() => reset()} gameUrl="https://squaredle.app/" />
    <GameShell index="02" title="Word Hunt" description="Map the letter grid, then uncover every path it holds. Letters can connect in any direction without reusing a tile.">
      {(inputs.error || solver.error) && <p className="error-note" role="alert">{inputs.error || solver.error}</p>}
      <form onSubmit={event => { event.preventDefault(); if (inputs.complete && !solver.loading) void solver.solve(letters); }}>
        <label htmlFor="grid-size" className="label">Board dimensions</label>
        <select id="grid-size" value={gridSize} onChange={event => reset(Number(event.target.value) as GridSize)} className="field mb-8">
          <option value={3}>3 × 3 — quick board</option><option value={4}>4 × 4 — standard board</option><option value={5}>5 × 5 — large board</option>
        </select>
        <div className="mx-auto grid w-fit gap-2 border border-[#c9c0ae] bg-[#e8dfcd]/60 p-4" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
          {letters.map((_, index) => <input key={index} {...inputs.bind(index)} aria-label={`Row ${Math.floor(index / gridSize) + 1}, column ${index % gridSize + 1}`} aria-describedby="wordhunt-entry-hint" className="tile-input" />)}
        </div>
        <p id="wordhunt-entry-hint" className="input-hint mt-4">Fill all {letters.length} tiles. Paste a row or the whole grid, reading left to right, top to bottom.</p>
        <div className="mt-8 flex justify-end"><button type="submit" className="primary-button" disabled={!inputs.complete || solver.loading}>{solver.loading ? "Searching…" : "Search the grid →"}</button></div>
      </form>
      <WordResults result={solver.result} />
    </GameShell>
  </>;
}

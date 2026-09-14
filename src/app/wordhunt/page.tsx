"use client";

import { useState } from "react";
import GameShell from "../components/game-shell";
import Navbar from "../components/navbar";
import WordResults from "../components/word-results";

type GridSize = 3 | 4 | 5;
const makeGrid = (size: GridSize) => Array.from({ length: size }, () => Array<string>(size).fill(""));

export default function WordHunt() {
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [letters, setLetters] = useState<string[][]>(() => makeGrid(4));
  const [result, setResult] = useState<Record<number, string[]> | null>(null);

  const reset = (size = gridSize) => {
    setGridSize(size);
    setLetters(makeGrid(size));
    setResult(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: letters.flat(), game: "wordhunt" }),
    });
    const data = await response.json();
    setResult(data.possible_words);
  };

  return <>
    <Navbar onRefresh={() => reset()} gameUrl="https://squaredle.app/" />
    <GameShell index="02" title="Word Hunt" description="Map the letter grid, then uncover every path it holds. Letters can connect in any direction without reusing a tile.">
      <form onSubmit={submit}>
        <label htmlFor="grid-size" className="label">Board dimensions</label>
        <select id="grid-size" value={gridSize} onChange={event => reset(Number(event.target.value) as GridSize)} className="field mb-8">
          <option value={3}>3 × 3 — quick board</option><option value={4}>4 × 4 — standard board</option><option value={5}>5 × 5 — large board</option>
        </select>
        <div className="mx-auto grid w-fit gap-2 border border-[#c9c0ae] bg-[#e8dfcd]/60 p-4" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
          {letters.map((row, rowIndex) => row.map((letter, columnIndex) => <input key={`${rowIndex}-${columnIndex}`} aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}`} maxLength={1} value={letter} onChange={event => setLetters(current => current.map((currentRow, r) => r === rowIndex ? currentRow.map((value, c) => c === columnIndex ? event.target.value.slice(-1).toUpperCase() : value) : currentRow))} className="tile-input" />))}
        </div>
        <div className="mt-8 flex justify-end"><button className="primary-button">Search the grid →</button></div>
      </form>
      <WordResults result={result} />
    </GameShell>
  </>;
}

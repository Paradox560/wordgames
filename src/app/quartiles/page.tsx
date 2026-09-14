"use client";

import { useState } from "react";
import GameShell from "../components/game-shell";
import Navbar from "../components/navbar";

const makeGrid = () => Array.from({ length: 5 }, () => Array<string>(4).fill(""));

export default function Quartiles() {
  const [letters, setLetters] = useState<string[][]>(makeGrid);
  const [result, setResult] = useState<string[][] | null>(null);

  const reset = () => { setLetters(makeGrid()); setResult(null); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: letters.flat(), game: "quartiles" }),
    });
    const data = await response.json();
    setResult(data.possible_words);
  };

  return <>
    <Navbar onRefresh={reset} gameUrl="https://support.apple.com/guide/iphone/solve-quartiles-puzzles-iph9ccdd1bab/ios" />
    <GameShell index="06" title="Quartiles" description="Transcribe each fragment in reading order. Then combine the little pieces into complete words.">
      <form onSubmit={submit}>
        <div className="mx-auto grid w-fit grid-cols-4 gap-2 border border-[#c9c0ae] bg-[#e8dfcd]/55 p-4">
          {letters.map((row, rowIndex) => row.map((letter, columnIndex) => <input key={`${rowIndex}-${columnIndex}`} aria-label={`Fragment row ${rowIndex + 1}, column ${columnIndex + 1}`} maxLength={5} value={letter} onChange={event => setLetters(current => current.map((currentRow, r) => r === rowIndex ? currentRow.map((value, c) => c === columnIndex ? event.target.value.toLowerCase() : value) : currentRow))} className="h-14 w-24 border border-[#a59c89] bg-[#fffdf7] px-1 text-center font-mono text-sm font-bold lowercase shadow-[2px_3px_0_rgba(73,60,39,.14)] outline-none focus:border-[#234d3c] focus:ring-2 focus:ring-[#234d3c]/20" />))}
        </div>
        <div className="mt-8 flex justify-end"><button className="primary-button">Assemble words →</button></div>
      </form>
      {result && result.length > 0 && <div className="results"><h2 className="result-heading">Complete words</h2><div className="mt-4 grid gap-2">{result.map((words, index) => <div key={index} className="word-chip text-left">{words.join(" + ")}</div>)}</div></div>}
    </GameShell>
  </>;
}

"use client";

import { useState } from "react";
import GameShell from "../components/game-shell";
import Navbar from "../components/navbar";
import WordResults from "../components/word-results";

export default function Anagrams() {
  const [count, setCount] = useState(6);
  const [letters, setLetters] = useState<string[]>(Array(6).fill(""));
  const [result, setResult] = useState<Record<number, string[]> | null>(null);

  const reset = (nextCount = count) => {
    setCount(nextCount);
    setLetters(Array(nextCount).fill(""));
    setResult(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: letters, game: "anagrams" }),
    });
    const data = await response.json();
    setResult(data.possible_words);
  };

  return <>
    <Navbar onRefresh={() => reset()} gameUrl="https://www.pogo.com/games/anagrams" />
    <GameShell index="03" title="Anagrams" description="Lay out your rack exactly as it appears. We’ll shake loose every word those letters can make.">
      <form onSubmit={submit}>
        <label className="label" htmlFor="letter-count">Letters on the rack</label>
        <select id="letter-count" className="field mb-8" value={count} onChange={event => reset(Number(event.target.value))}>
          {[6, 7, 8].map(number => <option key={number} value={number}>{number} letters</option>)}
        </select>
        <div className="flex justify-center gap-2 border-y border-[#c9c0ae] bg-[#e8dfcd]/45 px-3 py-8">
          {letters.map((letter, index) => <input key={index} aria-label={`Letter ${index + 1}`} maxLength={1} value={letter} onChange={event => setLetters(current => current.map((value, i) => i === index ? event.target.value.slice(-1).toUpperCase() : value))} className="tile-input" />)}
        </div>
        <div className="mt-8 flex justify-end"><button className="primary-button">Rearrange the rack →</button></div>
      </form>
      <WordResults result={result} />
    </GameShell>
  </>;
}

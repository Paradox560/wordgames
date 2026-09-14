"use client";

import { useState } from "react";
import GameShell from "../components/game-shell";
import Navbar from "../components/navbar";
import WordResults from "../components/word-results";

const positions = ["left-1/2 top-1/2", "left-1/2 top-[19%]", "left-[73%] top-[34%]", "left-[73%] top-[66%]", "left-1/2 top-[81%]", "left-[27%] top-[66%]", "left-[27%] top-[34%]"];

export default function SpellingBee() {
  const [letters, setLetters] = useState<string[]>(Array(7).fill(""));
  const [error, setError] = useState("");
  const [result, setResult] = useState<Record<number, string[]> | null>(null);

  const reset = () => { setLetters(Array(7).fill("")); setError(""); setResult(null); };
  const changeLetter = (index: number, value: string) => {
    const next = value.slice(-1).toUpperCase();
    if (next && letters.some((letter, i) => letter === next && i !== index)) {
      setError("Each letter can appear only once.");
      return;
    }
    setLetters(current => current.map((letter, i) => i === index ? next : letter));
    setError("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (letters.some(letter => !letter)) { setError("Fill all seven cells before searching."); return; }
    const response = await fetch("/api/solve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: letters, game: "spellingbee" }) });
    const data = await response.json();
    setResult(data.possible_words);
  };

  return <>
    <Navbar onRefresh={reset} gameUrl="https://www.nytimes.com/puzzles/spelling-bee" />
    <GameShell index="01" title="Spelling Bee" description="Put the required letter in the gold center cell, then add the six letters that surround it.">
      {error && <p className="error-note" role="alert">{error}</p>}
      <form onSubmit={submit}>
        <div className="relative mx-auto h-[300px] w-[300px]">{positions.map((position, index) => <input key={index} aria-label={index === 0 ? "Required center letter" : `Outer letter ${index}`} maxLength={1} value={letters[index]} onChange={event => changeLetter(index, event.target.value)} className={`absolute h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 text-center text-2xl font-black uppercase outline-none drop-shadow-[0_2px_1px_rgba(29,33,29,.28)] ${position} ${index === 0 ? "bg-[#e2ad3b] text-[#1d211d]" : "bg-[#d8cdb6] text-[#1d211d]"}`} style={{ clipPath: "polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)" }} />)}</div>
        <p className="text-center text-xs text-[#68685f]">Gold letter required in every answer</p>
        <div className="mt-8 flex justify-end"><button className="primary-button">Find the words →</button></div>
      </form>
      <WordResults result={result} />
    </GameShell>
  </>;
}

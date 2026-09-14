"use client";

import { useEffect, useState } from "react";

type GroupedWords = Record<number, string[]>;

export default function WordResults({ result }: { result: GroupedWords | null }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    setExpanded(new Set(result ? Object.keys(result).map(Number) : []));
  }, [result]);

  if (!result || Object.keys(result).length === 0) return null;

  const toggle = (length: number) => {
    setExpanded(current => {
      const next = new Set(current);
      if (next.has(length)) next.delete(length);
      else next.add(length);
      return next;
    });
  };

  return <div className="results">
    <div className="flex items-baseline justify-between">
      <h2 className="result-heading">Words on the board</h2>
      <span className="text-xs text-[#68685f]">sorted by length</span>
    </div>
    {Object.entries(result).map(([length, words]) => {
      const wordLength = Number(length);
      const isExpanded = expanded.has(wordLength);
      return <div key={length}>
        <button type="button" onClick={() => toggle(wordLength)} className="result-toggle" aria-expanded={isExpanded}>
          <span>{length} letters <span className="text-[#68685f]">({words.length})</span></span>
          <span>{isExpanded ? "−" : "+"}</span>
        </button>
        {isExpanded && <div className="word-grid">{[...words].sort().map(word => <div key={word} className="word-chip">{word}</div>)}</div>}
      </div>;
    })}
  </div>;
}

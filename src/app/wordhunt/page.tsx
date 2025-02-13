"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/navbar";

export default function WordHunt() {
  const [gridSize, setGridSize] = useState<3 | 4 | 5>(4);
  const [letters, setLetters] = useState<string[][]>([]);
  const [submittedLetters, setSubmittedLetters] = useState<string[]>([]);
  const [result, setResult] = useState<{ [key: number]: string[] } | null>(
    null
  );
  const [toggles, setToggles] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const initialLetters = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill("")
    );
    setLetters(initialLetters);
  }, [gridSize]);

  const handleLetterChange = (row: number, col: number, value: string) => {
    const updatedLetters = [...letters];
    updatedLetters[row][col] = value;
    setLetters(updatedLetters);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const flatLetters = letters.flat();
    setSubmittedLetters(flatLetters);

    try {
      const response = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: flatLetters, game: "wordhunt" }),
      });

      const data = await response.json();
      console.log(data);
      setResult(data.possible_words);
      setToggles(
        Object.keys(data.possible_words).reduce((acc, key) => {
          acc[Number(key)] = true;
          return acc;
        }, {} as { [key: number]: boolean })
      );
    } catch (error) {
      console.error("Error fetching word hunt words:", error);
    }
  };

  const refreshLetters = () => {
    const initialLetters = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill("")
    );
    setLetters(initialLetters);
    setSubmittedLetters([]);
    setResult(null);
    setToggles({});
  };

  const toggleSection = (key: number) => {
    setToggles((prevToggles) => ({
      ...prevToggles,
      [key]: !prevToggles[key],
    }));
  };

  return (
    <>
      <Navbar onRefresh={refreshLetters} gameUrl="https://squaredle.app/" />
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 pt-20 pb-12">
        <div className="max-w-xl mx-auto p-8 backdrop-blur-lg bg-white/30 rounded-2xl shadow-xl space-y-8">
          <h1 className="text-4xl font-extrabold text-center text-white drop-shadow-lg">
            Word Hunt Grid
          </h1>

          <div className="space-y-3">
            <label
              htmlFor="grid-size"
              className="block text-lg font-medium text-white drop-shadow"
            >
              Select grid size:
            </label>
            <select
              id="grid-size"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value) as 3 | 4 | 5)}
              className="w-full p-3 rounded-xl bg-white/20 border-2 border-white/50 
                text-white font-medium backdrop-blur-sm
                focus:outline-none focus:ring-2 focus:ring-white/50 
                transition-all duration-200"
            >
              <option value={3}>3 x 3</option>
              <option value={4}>4 x 4</option>
              <option value={5}>5 x 5</option>
            </select>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              className="grid gap-4 p-6 bg-white/20 rounded-xl backdrop-filter backdrop-blur-lg"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                width: "fit-content",
                margin: "0 auto",
              }}
            >
              {letters.map((row, rowIndex) =>
                row.map((letter, colIndex) => (
                  <input
                    key={`${rowIndex}-${colIndex}`}
                    type="text"
                    maxLength={1}
                    value={letter}
                    onChange={(e) =>
                      handleLetterChange(rowIndex, colIndex, e.target.value)
                    }
                    className="w-14 h-14 p-3 border-2 border-white/50 rounded-lg text-center 
                      text-xl font-bold text-white bg-white/10 
                      focus:outline-none focus:ring-2 focus:ring-white 
                      focus:border-transparent transition-all duration-200 
                      placeholder-white/50 uppercase"
                  />
                ))
              )}
            </div>

            <div className="mt-8 text-center">
              <button
                type="submit"
                className="px-8 py-3 bg-white/20 rounded-xl text-white font-bold
                  border-2 border-white/50 hover:bg-white/30 
                  transition-all duration-200"
              >
                Find Words
              </button>
            </div>
          </form>

          {/* Display result from API */}
          {result && Object.keys(result).length > 0 && (
            <div className="mt-6">
              <h2 className="text-2xl text-center font-medium">
                Possible Words:
              </h2>
              {Object.entries(result).map(([length, words]) => (
                <div key={length} className="mt-4">
                  <button
                    onClick={() => toggleSection(Number(length))}
                    className="w-full text-left px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-300 flex justify-between items-center"
                  >
                    {length} letters ({words.length})
                    <svg
                      className={`w-5 h-5 transform transition-transform ${
                        toggles[Number(length)] ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {toggles[Number(length)] && (
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      {words.sort().map((word, index) => (
                        <div
                          key={index}
                          className="p-2 bg-white/10 rounded-lg text-center text-white"
                        >
                          {word}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

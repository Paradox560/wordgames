"use client";

import React, { useState } from "react";
import Navbar from "../components/navbar";

const Page: React.FC = () => {
  const [numLetters, setNumLetters] = useState<number>(6); // Number of letters (dropdown value)
  const [letters, setLetters] = useState<string[]>([]); // Letters the user will input
  const [submittedLetters, setSubmittedLetters] = useState<string>(""); // To display submitted letters
  const [result, setResult] = useState<{ [key: number]: string[] } | null>(
    null
  ); // To store the result
  const [toggles, setToggles] = useState<{ [key: number]: boolean }>({}); // To store toggle states

  // Handle number of letters change from dropdown
  const handleNumberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const num = parseInt(e.target.value);
    setNumLetters(num);
    setLetters(Array(num).fill("")); // Reset input boxes
  };

  // Handle letter input changes
  const handleLetterChange = (index: number, value: string) => {
    const updatedLetters = [...letters];
    updatedLetters[index] = value;
    setLetters(updatedLetters);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedLetters(letters.join("")); // Join all letters as a string

    try {
      const response = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: letters, game: "anagrams" }),
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
      console.error("Error fetching anagrams:", error);
    }
  };

  // Function to refresh letters
  const refreshLetters = () => {
    setLetters(Array(numLetters).fill(""));
    setSubmittedLetters("");
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
      <Navbar
        onRefresh={refreshLetters}
        gameUrl="https://www.pogo.com/games/anagrams"
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-teal-500 py-12">
        <div className="max-w-4xl mx-auto p-8 backdrop-blur-lg bg-white/30 rounded-2xl shadow-xl space-y-8">
          <h1 className="text-4xl font-extrabold text-center text-white drop-shadow-lg">
            Anagram Solver
          </h1>

          <div className="space-y-6">
            <div className="space-y-3">
              <label
                htmlFor="letter-count"
                className="block text-lg font-medium text-white drop-shadow"
              >
                Choose the number of letters:
              </label>
              <select
                id="letter-count"
                value={numLetters}
                onChange={handleNumberChange}
                className="w-full p-3 rounded-xl bg-white/20 border-2 border-white/50 
                  text-white font-medium backdrop-blur-sm
                  focus:outline-none focus:ring-2 focus:ring-white/50 
                  transition-all duration-200"
              >
                {[6, 7, 8].map((n) => (
                  <option key={n} value={n} className="text-gray-800">
                    {n} letters
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="flex justify-center gap-2 p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                {Array.from({ length: numLetters }).map((_, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={letters[index] || ""}
                    onChange={(e) => handleLetterChange(index, e.target.value)}
                    className="w-16 h-16 text-center text-xl font-bold text-white 
                      bg-white/10 border-2 border-white/50 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-white 
                      focus:border-transparent transition-all duration-200 
                      placeholder-white/50 uppercase"
                  />
                ))}
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

            {result && Object.keys(result).length > 0 && (
              <div className="mt-8 text-white">
                <h2 className="text-2xl font-bold">Possible Words:</h2>
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
      </div>
    </>
  );
};

export default Page;

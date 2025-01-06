'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/navbar';

export default function WordHunt() {
  const [gridSize, setGridSize] = useState<4 | 5>(4);
  const [letters, setLetters] = useState<string[][]>([]);
  const [submittedLetters, setSubmittedLetters] = useState<string[][]>([]);

  useEffect(() => {
    const initialLetters = Array.from(
      { length: gridSize }, 
      () => Array(gridSize).fill("")
    );
    setLetters(initialLetters);
  }, [gridSize]);

  const handleLetterChange = (row: number, col: number, value: string) => {
    const updatedLetters = [...letters];
    updatedLetters[row][col] = value;
    setLetters(updatedLetters);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedLetters(letters);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 pt-20 pb-12">
        <div className="max-w-xl mx-auto p-8 backdrop-blur-lg bg-white/30 rounded-2xl shadow-xl space-y-8">
          <h1 className="text-4xl font-extrabold text-center text-white drop-shadow-lg">
            Word Hunt Grid
          </h1>

          <div className="space-y-3">
            <label htmlFor="grid-size" className="block text-lg font-medium text-white drop-shadow">
              Select grid size:
            </label>
            <select
              id="grid-size"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value) as 4 | 5)}
              className="w-full p-3 rounded-xl bg-white/20 border-2 border-white/50 
                text-white font-medium backdrop-blur-sm
                focus:outline-none focus:ring-2 focus:ring-white/50 
                transition-all duration-200"
            >
              <option value={4}>4 x 4</option>
              <option value={5}>5 x 5</option>
            </select>
          </div>

          <form onSubmit={handleSubmit}>
            <div 
              className="grid gap-4 p-6 bg-white/20 rounded-xl backdrop-filter backdrop-blur-lg"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                width: 'fit-content',
                margin: '0 auto'
              }}
            >
              {letters.map((row, rowIndex) =>
                row.map((letter, colIndex) => (
                  <input
                    key={`${rowIndex}-${colIndex}`}
                    type="text"
                    maxLength={1}
                    value={letter}
                    onChange={(e) => handleLetterChange(rowIndex, colIndex, e.target.value)}
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
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </form>

          {/* Display submitted letters in a 2D grid format */}
          {submittedLetters.length > 0 && (
            <div className="mt-6">
              <h2 className="text-2xl text-center font-medium">Submitted Letters:</h2>
              <div className="mt-4 grid grid-cols-4 gap-4">
                {submittedLetters.map((row, rowIndex) =>
                  row.map((letter, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="p-3 border border-gray-300 rounded-lg text-center"
                    >
                      {letter}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

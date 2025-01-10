'use client';

import { useState } from 'react';
import Navbar from '../components/navbar';

export default function LetterLoop() {
  const [letters, setLetters] = useState<string[]>(Array(8).fill(''));
  const [submittedLetters, setSubmittedLetters] = useState<string>('');
  const [result, setResult] = useState<{ [key: number]: string[] } | null>(null);

  const handleLetterChange = (index: number, value: string) => {
    const updatedLetters = [...letters];
    updatedLetters[index] = value;
    setLetters(updatedLetters);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedLetters(letters.join(''));

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: letters, game: 'letterloop' }),
      });

      const data = await response.json();
      console.log(data);
      setResult(data.possible_words);
    } catch (error) {
      console.error('Error fetching letter loop words:', error);
    }
  };

  const refreshLetters = () => {
    setLetters(Array(8).fill(''));
    setSubmittedLetters('');
    setResult(null);
  };

  const circlePositions = [
    { top: '10%', left: '50%', transform: 'translate(-50%, -50%)' }, // top
    { top: '22.5%', left: '77.5%', transform: 'translate(-50%, -50%)' }, // top right
    { top: '50%', left: '90%', transform: 'translate(-50%, -50%)' }, // right
    { top: '77.5%', left: '77.5%', transform: 'translate(-50%, -50%)' }, // bottom right
    { top: '90%', left: '50%', transform: 'translate(-50%, -50%)' }, // bottom
    { top: '77.5%', left: '22.5%', transform: 'translate(-50%, -50%)' }, // bottom left
    { top: '50%', left: '10%', transform: 'translate(-50%, -50%)' }, // left
    { top: '22.5%', left: '22.5%', transform: 'translate(-50%, -50%)' }, // top left
  ];

  return (
    <>
      <Navbar onRefresh={refreshLetters} gameUrl='https://www.theletterloop.com/'/>
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-red-500 to-yellow-500 py-12">
        <div className="max-w-xl mx-auto p-8 backdrop-blur-lg bg-white/30 rounded-2xl shadow-xl space-y-8">
          <h1 className="text-4xl font-extrabold text-center text-white drop-shadow-lg">
            Letter Loop
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="relative w-[400px] h-[400px] mx-auto">
              {circlePositions.map((pos, index) => (
                <div
                  key={index}
                  className="absolute"
                  style={{
                    top: pos.top,
                    left: pos.left,
                    transform: pos.transform,
                  }}
                >
                  <input
                    type="text"
                    maxLength={1}
                    value={letters[index]}
                    onChange={(e) => handleLetterChange(index, e.target.value)}
                    className="w-16 h-16 text-center text-3xl font-bold text-white 
                      bg-white/20 border-2 border-white/50 rounded-full
                      focus:outline-none focus:ring-2 focus:ring-white 
                      transition-all duration-200 uppercase"
                  />
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <button
                type="submit"
                className="px-8 py-3 bg-white/20 rounded-xl text-white font-bold
                  border-2 border-white/50 hover:bg-white/30 transition-all duration-200"
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
                  <h3 className="text-xl font-semibold">{length} letters:</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {words.sort().map((word, index) => (
                      <div key={index} className="p-2 bg-white/10 rounded-lg text-center text-white">
                        {word}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

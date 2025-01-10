'use client';

import { useState } from 'react';
import Navbar from '../components/navbar';

export default function SpellingBee() {
  const [letters, setLetters] = useState(Array(7).fill(''));
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<{ [key: number]: string[] } | null>(null); // To store the result
  const centerIndex = 0; // Center hexagon is always first in the array

  const handleLetterChange = (index: number, value: string) => {
    const newValue = value.toUpperCase();
    
    // Check for duplicates
    if (newValue && letters.includes(newValue)) {
      setError('Duplicate letters are not allowed');
      return;
    }

    const newLetters = [...letters];
    newLetters[index] = newValue;
    setLetters(newLetters);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation checks
    if (letters.some(letter => !letter)) {
      setError('Please fill all letters');
      return;
    }

    if (new Set(letters).size !== letters.length) {
      setError('Duplicate letters are not allowed');
      return;
    }

    const centerLetter = letters[centerIndex];
    setError('');
    
    // Submit valid letters with center letter marked
    const submissionData = {
      letters: letters,
      centerLetter: centerLetter
    };
    
    // Handle submission logic here
    console.log(submissionData);

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: letters, game: 'spellingbee' }),
      });

      const data = await response.json();
      console.log(data);
      setResult(data.possible_words);
    } catch (error) {
      console.error('Error fetching spelling bee words:', error);
    }
  };

  const refreshLetters = () => {
    setLetters(Array(7).fill(''));
    setError('');
    setResult(null);
  };

  const hexagonPositions = [
    { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bg: 'bg-yellow-400' }, // center
    { top: '24%', left: '50%', transform: 'translate(-50%, -50%)', bg: 'bg-white/30' }, // top
    { top: '37%', left: '70%', transform: 'translate(-50%, -50%)', bg: 'bg-white/30' }, // top right
    { top: '63%', left: '70%', transform: 'translate(-50%, -50%)', bg: 'bg-white/30' }, // bottom right
    { top: '76%', left: '50%', transform: 'translate(-50%, -50%)', bg: 'bg-white/30' }, // bottom
    { top: '63%', left: '30%', transform: 'translate(-50%, -50%)', bg: 'bg-white/30' }, // bottom left
    { top: '37%', left: '30%', transform: 'translate(-50%, -50%)', bg: 'bg-white/30' }, // top left
  ];

  return (
    <>
      <Navbar onRefresh={refreshLetters} gameUrl='https://www.nytimes.com/puzzles/spelling-bee'/>
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-500 py-12">
        <div className="max-w-xl mx-auto p-8 backdrop-blur-lg bg-white/30 rounded-2xl shadow-xl space-y-8">
          <h1 className="text-4xl font-extrabold text-center text-white drop-shadow-lg">
            Spelling Bee
          </h1>
          
          {error && (
            <div className="text-black text-center font-medium bg-red-400 
              backdrop-blur-sm rounded-lg p-3 border border-red-200/20">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="relative w-[400px] h-[400px] mx-auto">  {/* Increased from 300px */}
              {hexagonPositions.map((pos, index) => (
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
                    className={`w-24 h-24 ${pos.bg} text-center text-3xl font-bold text-white`}
                    style={{
                      clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                    }}
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
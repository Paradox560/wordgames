import Link from 'next/link';

type Tile = {
  word: string;
  url: string;
  icon: string;
};

const games: Tile[] = [
  { word: "Spelling Bee", url: "/spellingbee", icon: "🐝" },
  { word: "Word Hunt", url: "/wordhunt", icon: "🎯" },
  { word: "Anagrams", url: "/anagrams", icon: "🌀" },
  // { word: "Wordle", url: "/wordle", icon: "🟩" },
  // { word: "Letter Loop", url: "/letterloop", icon: "🔄" }
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-500 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">
            Word Games Solver
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Select a game below to start solving puzzles and expanding your vocabulary
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {games.map((game, index) => (
            <Link key={index} href={game.url}>
              <div className="group h-64 relative overflow-hidden rounded-2xl backdrop-blur-lg bg-white/20 
                border border-white/30 shadow-xl transition-all duration-300 
                hover:scale-105 hover:bg-white/30">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 
                  group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-8 h-full flex flex-col items-center justify-center space-y-4">
                  <span className="text-5xl">{game.icon}</span>
                  <h2 className="text-2xl font-bold text-white text-center">{game.word}</h2>
                  <span className="text-white/70 text-sm">Click to solve →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

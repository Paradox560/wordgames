import Link from 'next/link';
import Brand from './components/brand';

const games = [
  { name: "Spelling Bee", url: "/spellingbee", mark: "A", meta: "7 letters" },
  { name: "Word Hunt", url: "/wordhunt", mark: "B", meta: "3×3 — 5×5" },
  { name: "Anagrams", url: "/anagrams", mark: "C", meta: "6 — 8 letters" },
  { name: "Wordle", url: "/wordle", mark: "D", meta: "5 letters" },
  { name: "Letter Loop", url: "/letterloop", mark: "E", meta: "8 letters" },
  { name: "Quartiles", url: "/quartiles", mark: "F", meta: "20 tiles" },
];

export default function Home() {
  return <main>
    <header className="border-b border-[#c9c0ae]">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5">
        <Brand />
        <p className="hidden text-xs font-bold uppercase tracking-[.13em] text-[#68685f] sm:block">The solver's desk · Vol. 01</p>
      </div>
    </header>
    <section className="border-b border-[#c9c0ae] bg-[#e8dfcd]/45">
      <div className="mx-auto grid max-w-7xl md:grid-cols-2 lg:grid-cols-3">
        {games.map(game => <Link key={game.url} href={game.url} className="group relative min-h-[210px] border-b border-[#c9c0ae] p-7 transition-colors hover:bg-[#fffdf7] md:border-r lg:[&:nth-child(3n)]:border-r-0">
          <div className="flex items-start justify-between">
            <span className="grid h-10 w-10 place-items-center border border-[#928873] font-mono text-sm font-bold transition-all group-hover:border-[#234d3c] group-hover:bg-[#234d3c] group-hover:text-white">{game.mark}</span>
            <span className="text-xs font-bold uppercase tracking-[.11em] text-[#68685f]">{game.meta}</span>
          </div>
          <h2 className="wordmark mt-10 text-3xl">{game.name}</h2>
          <span className="absolute bottom-7 right-7 text-xl transition-transform group-hover:translate-x-1">→</span>
        </Link>)}
      </div>
    </section>
    <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-xs text-[#68685f] sm:flex-row sm:justify-between"><span>Made for the next clue.</span><span>Dictionary open. Pencil ready.</span></footer>
  </main>;
}

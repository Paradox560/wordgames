"use client";
import Link from "next/link";
import Brand from "./brand";
interface NavbarProps {
  onRefresh: () => void;
  gameUrl: string;
}
export default function Navbar({ onRefresh, gameUrl }: NavbarProps) {
  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 border-b border-[#c9c0ae] bg-[#f3efe4]/95 backdrop-blur-sm"
      aria-label="Game tools"
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-5">
        <Link
          href="/"
          className="group flex min-h-11 min-w-11 shrink-0 items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#234d3c]"
          aria-label="Back to the WordEngine home page"
        >
          <Brand compact />
        </Link>
        <div className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[.1em]">
          <button
            onClick={onRefresh}
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap border border-[#c9c0ae] px-3 py-2.5 transition-colors hover:bg-[#e8dfcd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#234d3c]"
            aria-label="Clear this puzzle"
          >
            Clear
          </button>
          <a
            href={gameUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap bg-[#1d211d] px-3 py-2.5 text-[#f3efe4] transition-colors hover:bg-[#234d3c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#234d3c]"
            aria-label="Play the original game (opens in a new tab)"
          >
            <span className="sm:hidden" aria-hidden="true">Play ↗</span>
            <span className="hidden sm:inline" aria-hidden="true">Play original ↗</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

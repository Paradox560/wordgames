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
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5">
        <Link
          href="/"
          className="group"
          aria-label="Back to the WordEngine home page"
        >
          <Brand />
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em]">
          <button
            onClick={onRefresh}
            className="border border-[#c9c0ae] px-3 py-2.5 transition-colors hover:bg-[#e8dfcd]"
            aria-label="Clear this puzzle"
          >
            Clear
          </button>
          <a
            href={gameUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-[#1d211d] px-3 py-2.5 text-[#f3efe4] transition-colors hover:bg-[#234d3c]"
          >
            Play original ↗
          </a>
        </div>
      </div>
    </nav>
  );
}

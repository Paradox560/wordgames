'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full p-4 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <Link href="/">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-lg
            border border-white/30 flex items-center justify-center
            hover:bg-white/30 transition-all duration-300 group">
            <svg
              className="w-5 h-5 text-white transform group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </div>
        </Link>
      </div>
    </nav>
  );
}
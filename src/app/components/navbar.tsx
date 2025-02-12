'use client';

import Link from 'next/link';

interface NavbarProps {
  onRefresh: () => void;
  gameUrl: string;
}

export default function Navbar({ onRefresh, gameUrl }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 w-full p-4 z-50">
      <div className="max-w-7xl mx-auto px-4 flex justify-between">
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
        <div className="relative group flex items-center space-x-4">
          <div className="relative group">
            <button
              onClick={onRefresh}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-lg
                border border-white/30 flex items-center justify-center
                hover:bg-white/30 transition-all duration-300"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v6h6M20 20v-6h-6M4 20l16-16"
                />
              </svg>
            </button>
            <div className="absolute top-full mt-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
              Refresh Page
            </div>
          </div>
          <div className="relative group">
            <Link href={gameUrl} target='_blank'>
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
            </Link>
            <div className="absolute top-full mt-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
              Go to Game
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
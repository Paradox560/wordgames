import type { ReactNode } from "react";
import { games } from "../games";

interface GameShellProps {
  index: string;
  title: string;
  description: string;
  children: ReactNode;
  steps?: readonly string[];
}

export default function GameShell({
  index, title, description, children,
  steps = ["Enter the puzzle clues", "Check the board once", "Find your missing word"],
}: GameShellProps) {
  return <main className="game-page">
    <div className="game-layout">
      <aside className="game-intro">
        <p className="eyebrow">Workbench {index}</p>
        <h1 className="game-title">{title}</h1>
        <p className="game-copy">{description}</p>
        <div className="step-list">
          {steps.map((step, i) => <p key={step}><span>{i + 1}</span>{step}</p>)}
        </div>
      </aside>
      <section className="workbench">
        <div className="workbench-head">
          <span className="text-xs font-bold uppercase tracking-[.13em]">Puzzle board</span>
          <span className="font-mono text-xs text-[#68685f]">{index} / {String(games.length).padStart(2, "0")}</span>
        </div>
        <div className="workbench-body">{children}</div>
      </section>
    </div>
  </main>;
}

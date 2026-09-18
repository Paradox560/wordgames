"use client";

import { useEffect, useRef, useState } from "react";

export default function useLetterSolver<T>(game: string) {
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);
  const clear = () => {
    activeRequest.current?.abort(); activeRequest.current = null;
    setResult(null); setError(""); setLoading(false);
  };
  const solve = async (letters: string[]) => {
    clear();
    const controller = new AbortController();
    activeRequest.current = controller; setLoading(true);
    try {
      const response = await fetch("/api/solve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, data: letters }), signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok || data.possible_words == null) throw new Error("The solver is unavailable right now. Please try again.");
      if (activeRequest.current === controller) setResult(data.possible_words);
    } catch (problem) {
      if (activeRequest.current === controller && !controller.signal.aborted) {
        setError(problem instanceof Error && problem.name !== "TypeError" ? problem.message : "Could not reach the solver. Please try again.");
      }
    } finally {
      if (activeRequest.current === controller) { activeRequest.current = null; setLoading(false); }
    }
  };
  return { result, error, loading, clear, solve };
}

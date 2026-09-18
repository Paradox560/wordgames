"use client";

import { useRef, useState, type ChangeEvent, type ClipboardEvent, type FocusEvent, type KeyboardEvent } from "react";
import { nextTile, pasteTiles, previousEmptyTile, tilesComplete, type TileRules } from "../lib/tile-input";

export default function useTileInputs(values: string[], onChange: (values: string[]) => void, rules: TileRules = {}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState("");
  const maxLength = rules.maxLength ?? 1;
  const focus = (index: number) => { refs.current[index]?.focus(); refs.current[index]?.select(); };
  const clearError = () => setError("");
  const bind = (index: number) => ({
    ref: (element: HTMLInputElement | null) => { refs.current[index] = element; },
    value: values[index], maxLength, autoComplete: "off", autoCorrect: "off", autoCapitalize: "characters", spellCheck: false,
    onFocus: (event: FocusEvent<HTMLInputElement>) => event.currentTarget.select(),
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value && (!/^[a-z]+$/i.test(value) || value.length > maxLength)) { setError("Use letters A–Z only."); return; }
      const next = values.map((current, i) => i === index ? value.toUpperCase() : current);
      const filled = next.filter(Boolean).map(letter => letter.toUpperCase());
      if (rules.unique && new Set(filled).size !== filled.length) { setError("Each letter can appear only once."); return; }
      clearError(); onChange(next);
      if (value.length === maxLength) focus(nextTile(index, values.length));
    },
    onPaste: (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      try {
        const pasted = pasteTiles(values, index, event.clipboardData.getData("text"), rules);
        clearError(); onChange(pasted.values);
        requestAnimationFrame(() => focus(pasted.focus));
      } catch (problem) { setError(problem instanceof Error ? problem.message : "Could not paste those tiles."); }
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const previous = previousEmptyTile(values, index);
      if (event.key === "Backspace" && previous !== null) { event.preventDefault(); focus(previous); }
      else if (maxLength === 1 && event.key === "ArrowLeft" && index > 0) { event.preventDefault(); focus(index - 1); }
      else if (maxLength === 1 && event.key === "ArrowRight" && index < values.length - 1) { event.preventDefault(); focus(index + 1); }
      else if (maxLength > 1 && event.key === " " && values[index]) { event.preventDefault(); focus(nextTile(index, values.length)); }
    },
  });
  return { bind, focus, error, clearError, complete: tilesComplete(values, rules) };
}

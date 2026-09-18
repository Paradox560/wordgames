export type TileRules = { maxLength?: number; minLength?: number; rowLength?: number; unique?: boolean };

export function tilesComplete(values: readonly string[], { minLength = 1, maxLength = 1, unique = false }: TileRules = {}) {
  return values.length > 0 && values.every(value => /^[a-z]+$/i.test(value) && value.length >= minLength && value.length <= maxLength)
    && (!unique || new Set(values.map(value => value.toUpperCase())).size === values.length);
}

export function parseTilePaste(text: string, maxLength = 1): string[] {
  const normalized = text.trim();
  if (!normalized || !/^[a-z\s,;|]+$/i.test(normalized)) throw new Error("Paste letters A–Z, separated by spaces, commas, or line breaks.");
  const parts = normalized.split(/[\s,;|]+/).filter(Boolean);
  const values = maxLength === 1 ? [...parts.join("")] : parts;
  if (!values.length || values.some(value => value.length > maxLength)) {
    throw new Error(`Each tile holds up to ${maxLength} letters. Separate fragments or words with spaces.`);
  }
  return values.map(value => value.toUpperCase());
}

export function pasteTiles(values: readonly string[], index: number, text: string, rules: TileRules = {}) {
  const pasted = parseTilePaste(text, rules.maxLength);
  const start = pasted.length === values.length ? 0
    : rules.rowLength && pasted.length === rules.rowLength ? Math.floor(index / rules.rowLength) * rules.rowLength : index;
  if (start + pasted.length > values.length) throw new Error("That paste does not fit. No tiles were changed.");
  const next = [...values];
  next.splice(start, pasted.length, ...pasted);
  const filled = next.filter(Boolean).map(value => value.toUpperCase());
  if (rules.unique && new Set(filled).size !== filled.length) throw new Error("Each letter can appear only once. No tiles were changed.");
  return { values: next, focus: Math.min(start + pasted.length, values.length - 1) };
}

export function previousEmptyTile(values: readonly string[], index: number) {
  return !values[index] && index > 0 ? index - 1 : null;
}

export function nextTile(index: number, count: number) {
  return Math.min(index + 1, count - 1);
}

export function pasteWordle(board: readonly string[][], row: number, column: number, text: string) {
  const pasted = parseTilePaste(text);
  if (pasted.length > 30 || (pasted.length > 5 && pasted.length % 5 !== 0)) {
    throw new Error("Paste one word or up to six complete five-letter guesses.");
  }
  const start = pasted.length > 5 ? 0 : pasted.length === 5 ? row * 5 : row * 5 + column;
  if (pasted.length < 5 && column + pasted.length > 5) throw new Error("That paste does not fit this guess. No tiles were changed.");
  const flat = pasted.length > 5 ? Array<string>(pasted.length).fill("") : board.flat();
  while (flat.length < start + pasted.length) flat.push("");
  flat.splice(start, pasted.length, ...pasted);
  const values = Array.from({ length: flat.length / 5 }, (_, index) => flat.slice(index * 5, index * 5 + 5));
  const focus = Math.min(start + pasted.length, flat.length - 1);
  return { values, row: Math.floor(focus / 5), column: focus % 5 };
}

export function wordleComplete(rows: readonly { letters: string[]; colors: string[] }[]) {
  if (rows.length > 6) return false;
  const filled = rows.filter(row => row.letters.some(Boolean));
  return filled.length > 0 && filled.every(row => row.letters.length === 5 && tilesComplete(row.letters)
    && row.colors.length === 5 && row.colors.every(color => ["gray", "yellow", "green"].includes(color)));
}

export function numbwordComplete(length: number, total: string, present: string, absent: string) {
  const required = present.trim().toUpperCase();
  const excluded = absent.trim().toUpperCase();
  const score = Number(total);
  return /^\d+$/.test(total.trim()) && Number.isInteger(score) && score >= length && score <= 26 * length
    && /^[A-Z]*$/.test(required) && /^[A-Z]*$/.test(excluded)
    && new Set(required).size <= length && [...required].every(letter => !excluded.includes(letter));
}

/** Parses pasted lists: "Klaus (2019)", "Klaus 2019", "Klaus - 2019", "1. Klaus" or just "Klaus". */
export function parseLines(text: string): { query: string; year?: number }[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.*?)[\s,–-]*\(?\b(19\d{2}|20\d{2})\b\)?\s*$/);
      return m && m[1].trim() ? { query: m[1].trim(), year: Number(m[2]) } : { query: line };
    });
}

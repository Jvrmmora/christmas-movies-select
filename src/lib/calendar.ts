import type { RangePreset } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

export const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Season year: after Dec 24 the next season starts. */
export function seasonFor(today: Date): number {
  const y = today.getFullYear();
  return today > new Date(y, 11, 24, 23, 59, 59) ? y + 1 : y;
}

export function seasonEnd(season: number): string {
  return `${season}-12-24`;
}

export const PRESETS: { key: RangePreset; label: string }[] = [
  { key: "today", label: "Desde hoy" },
  { key: "oct", label: "1 oct" },
  { key: "nov", label: "1 nov" },
  { key: "dec", label: "1 dic" },
  { key: "novena", label: "Novena" },
  { key: "custom", label: "Personalizado" },
];

export function presetStart(preset: RangePreset, season: number, today: Date, custom?: string): string {
  const end = seasonEnd(season);
  let start: string;
  switch (preset) {
    case "today":
      start = toKey(today);
      break;
    case "oct":
      start = `${season}-10-01`;
      break;
    case "nov":
      start = `${season}-11-01`;
      break;
    case "dec":
      start = `${season}-12-01`;
      break;
    case "novena":
      start = `${season}-12-16`;
      break;
    default:
      start = custom && DATE_KEY.test(custom) ? custom : `${season}-11-15`;
  }
  return start > end ? end : start;
}

export function rangeDays(start: string, end: string): string[] {
  const days: string[] = [];
  const last = parseKey(end);
  for (let d = parseKey(start); d <= last; d.setDate(d.getDate() + 1)) days.push(toKey(d));
  return days;
}

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export type MonthCell =
  | { kind: "blank"; id: string }
  | { kind: "out"; id: string; day: number }
  | { kind: "xmas"; id: string }
  | { kind: "door"; id: string; day: number; key: string; index: number };

/** Monday-first calendar grid for one month (YYYY-MM). */
export function monthCells(monthKey: string, inRange: Map<string, number>): MonthCell[] {
  const [y, m] = monthKey.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const lastDay = new Date(y, m, 0).getDate();
  const cells: MonthCell[] = [];
  for (let i = 0; i < offset; i++) cells.push({ kind: "blank", id: `b${i}` });
  for (let d = 1; d <= lastDay; d++) {
    const key = `${monthKey}-${pad(d)}`;
    if (m === 12 && d === 25) {
      cells.push({ kind: "xmas", id: key });
      continue;
    }
    if (m === 12 && d > 25) continue;
    const index = inRange.get(key);
    if (index === undefined) cells.push({ kind: "out", id: key, day: d });
    else cells.push({ kind: "door", id: key, day: d, key, index });
  }
  return cells;
}

/** Empty days from `fromKey` onwards, in order. */
export function freeDays(days: string[], assignments: Record<string, string>, fromKey: string): string[] {
  return days.filter((k) => k >= fromKey && !assignments[k]);
}

/**
 * Spreads `movieIds` over the free days of the range.
 * - Each movie leaves any day it already had (including days outside the current range),
 *   so it can never end up assigned twice.
 * - Days from `fromKey` on come first; earlier free days are used only if the movies don't fit.
 */
export function planAutoFill(
  days: string[],
  assignments: Record<string, string>,
  movieIds: string[],
  fromKey: string,
): { next: Record<string, string>; placed: number; left: number } {
  const moving = new Set(movieIds);
  const next = Object.fromEntries(Object.entries(assignments).filter(([, id]) => !moving.has(id)));
  const free = [...days.filter((k) => k >= fromKey && !next[k]), ...days.filter((k) => k < fromKey && !next[k])];
  const placed = Math.min(movieIds.length, free.length);
  for (let i = 0; i < placed; i++) next[free[i]] = movieIds[i];
  return { next, placed, left: movieIds.length - placed };
}

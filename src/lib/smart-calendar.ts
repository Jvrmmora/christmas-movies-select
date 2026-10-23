import { parseKey } from "./calendar";
import { DEFAULT_RUNTIME } from "./insights";
import type { Movie } from "./types";

/** What the smart fill needs from a movie. */
export type SmartMovie = Pick<Movie, "id" | "runtimeMinutes" | "genres" | "myRating" | "favorite" | "ratings">;

/** At or above this a movie is long (weekend material); below SHORT_MINUTES it is short (weeknight). */
const LONG_MINUTES = 120;
const SHORT_MINUTES = 100;

// How much each rule weighs when choosing a movie for a day (lower total cost wins).
const W_CRESCENDO = 1;
const W_LENGTH = 0.8;
const W_GENRE = 0.6;

/** Stars first, then the heart, then IMDb; negative when `a` is worse than `b`. */
function compareQuality(a: SmartMovie, b: SmartMovie): number {
  return (a.myRating ?? 0) - (b.myRating ?? 0) || Number(a.favorite) - Number(b.favorite) || (a.ratings.imdb ?? 0) - (b.ratings.imdb ?? 0);
}

/** 0 = fits the day perfectly, 1 = the worst fit (a short one on a weekend, a long one on a weeknight). */
function lengthMisfit(minutes: number, weekend: boolean): number {
  const kind = minutes >= LONG_MINUTES ? "long" : minutes < SHORT_MINUTES ? "short" : "medium";
  if (kind === "medium") return 0.5;
  return (kind === "long") === weekend ? 0 : 1;
}

/**
 * Like planAutoFill, but chooses which movie goes on which day:
 * - Long movies lean to Saturday and Sunday, short ones to weeknights (no runtime counts as medium).
 * - The best liked rise towards Christmas (stars, then the heart, then IMDb).
 * - The same main genre doesn't repeat on consecutive days when there's an alternative.
 * - Christmas Eve stays free for the household to choose, unless the movies need that day.
 * - When not every movie fits, the least liked are the ones left out.
 * Same contract as planAutoFill: a movie leaves any day it already had, other days are untouched,
 * and days from `fromKey` on come before earlier free days.
 */
export function planSmartFill(
  days: string[],
  assignments: Record<string, string>,
  movies: SmartMovie[],
  fromKey: string,
): { next: Record<string, string>; placed: number; left: number } {
  const moving = new Set(movies.map((m) => m.id));
  const next = Object.fromEntries(Object.entries(assignments).filter(([, id]) => !moving.has(id)));
  const free = [...days.filter((k) => k >= fromKey && !next[k]), ...days.filter((k) => k < fromKey && !next[k])];

  const eve = free.find((k) => k.endsWith("-12-24"));
  const candidates = eve && free.length > movies.length ? free.filter((k) => k !== eve) : free;
  const placed = Math.min(movies.length, candidates.length);
  const slots = candidates.slice(0, placed).sort();

  // The least liked are the ones left out; the rest keep the order they came in, which breaks ties.
  const leftOut = new Set([...movies].sort((a, b) => compareQuality(b, a)).slice(placed).map((m) => m.id));
  const remaining = movies.filter((m) => !leftOut.has(m.id));

  // Where each movie sits between worst (0) and best (1); movies liked equally share a place.
  const standing = new Map(
    remaining.map((m) => [m.id, remaining.length > 1 ? remaining.filter((o) => compareQuality(o, m) < 0).length / (remaining.length - 1) : 0]),
  );

  let previous: SmartMovie | undefined;
  slots.forEach((key, i) => {
    const target = slots.length > 1 ? i / (slots.length - 1) : 1;
    const weekend = [0, 6].includes(parseKey(key).getDay());
    let best = 0;
    let bestCost = Infinity;
    remaining.forEach((m, j) => {
      const repeats = !!previous && !!m.genres[0] && previous.genres[0] === m.genres[0];
      const cost =
        Math.abs(standing.get(m.id)! - target) * W_CRESCENDO + lengthMisfit(m.runtimeMinutes ?? DEFAULT_RUNTIME, weekend) * W_LENGTH + (repeats ? W_GENRE : 0);
      if (cost < bestCost - 1e-9) {
        best = j;
        bestCost = cost;
      }
    });
    const [chosen] = remaining.splice(best, 1);
    next[key] = chosen.id;
    previous = chosen;
  });

  return { next, placed, left: movies.length - placed };
}

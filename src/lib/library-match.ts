import { normalize } from "./metadata/justwatch";

export interface LibraryEntry {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
  externalIds?: { imdbId?: string; tmdbId?: string; justwatchId?: string };
}

export interface LibraryHit {
  id: string;
  title: string;
}

export interface LibraryIndex {
  byJustwatch: Map<string, LibraryHit>;
  byImdb: Map<string, LibraryHit>;
  byTitleYear: Map<string, LibraryHit>;
}

const titleYear = (title: string, year: number) => `${normalize(title)}|${year}`;

export function buildLibraryIndex(entries: LibraryEntry[]): LibraryIndex {
  const index: LibraryIndex = { byJustwatch: new Map(), byImdb: new Map(), byTitleYear: new Map() };
  for (const e of entries) {
    const hit = { id: e.id, title: e.title };
    if (e.externalIds?.justwatchId) index.byJustwatch.set(e.externalIds.justwatchId, hit);
    if (e.externalIds?.imdbId) index.byImdb.set(e.externalIds.imdbId, hit);
    for (const t of [e.title, e.originalTitle]) if (t) index.byTitleYear.set(titleYear(t, e.year), hit);
  }
  return index;
}

/**
 * Is this movie already in the library? Matches by JustWatch id, IMDb id, or
 * (normalized title, same year) so manually typed entries are caught too.
 */
export function findInLibrary(
  index: LibraryIndex,
  movie: { title: string; originalTitle?: string; year: number; externalIds?: { imdbId?: string; justwatchId?: string } },
  ignoreId?: string,
): LibraryHit | null {
  const candidates = [
    movie.externalIds?.justwatchId ? index.byJustwatch.get(movie.externalIds.justwatchId) : undefined,
    movie.externalIds?.imdbId ? index.byImdb.get(movie.externalIds.imdbId) : undefined,
    index.byTitleYear.get(titleYear(movie.title, movie.year)),
    movie.originalTitle ? index.byTitleYear.get(titleYear(movie.originalTitle, movie.year)) : undefined,
  ];
  return candidates.find((hit) => hit && hit.id !== ignoreId) ?? null;
}

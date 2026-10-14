import type { Candidate, MovieData } from "../types";
import { getJustWatchTitle, searchJustWatch } from "./justwatch";
import { omdbRatings } from "./omdb";

export { MetadataError } from "./justwatch";

export async function lookupMovie(title: string, year?: number): Promise<Candidate[]> {
  return searchJustWatch(title, year);
}

/** Fills rating gaps from OMDb when a key is configured. */
export async function enrich<T extends MovieData>(data: T): Promise<T> {
  const { imdb, rottenTomatoes } = data.ratings;
  if (imdb !== null && rottenTomatoes !== null) return data;
  const extra = await omdbRatings(data.externalIds.imdbId);
  if (!extra) return data;
  return {
    ...data,
    ratings: {
      ...data.ratings,
      imdb: imdb ?? extra.imdb ?? null,
      rottenTomatoes: rottenTomatoes ?? extra.rottenTomatoes ?? null,
    },
  };
}

/** Fresh ratings, availability and artwork for a saved movie. Titles and notes stay untouched. */
export async function fetchLatest(justwatchId: string | undefined, title: string, year: number): Promise<Candidate | null> {
  if (justwatchId) {
    const byId = await getJustWatchTitle(justwatchId);
    if (byId) return enrich(byId);
  }
  const [best] = await searchJustWatch(title, year);
  return best && best.score >= 0.6 ? enrich(best) : null;
}

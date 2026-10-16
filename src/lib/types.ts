export type OfferType = "flatrate" | "free" | "ads" | "rent" | "buy";

export interface StreamingOffer {
  /** Stable provider key, e.g. "netflix", "disneyplus". */
  provider: string;
  /** Display name, e.g. "Disney+". */
  name: string;
  logoUrl?: string;
  type: OfferType;
  url: string;
}

export interface Ratings {
  imdb: number | null;
  imdbVotes?: number | null;
  rottenTomatoes: number | null;
  certifiedFresh: boolean;
}

export interface ExternalIds {
  imdbId?: string;
  tmdbId?: string;
  justwatchId?: string;
}

/** Everything that can be filled automatically from a title + year. */
export interface MovieData {
  title: string;
  originalTitle: string;
  year: number;
  posterUrl: string;
  backdropUrl: string;
  synopsis: string;
  genres: string[];
  runtimeMinutes: number | null;
  trailerUrl: string;
  ratings: Ratings;
  streaming: StreamingOffer[];
  externalIds: ExternalIds;
}

/** Serializable movie handed to client components. */
export interface Movie extends MovieData {
  id: string;
  watched: boolean;
  watchedAt: string | null;
  myRating: number | null;
  notes: string;
  favorite: boolean;
  source: "auto" | "manual";
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate extends MovieData {
  justwatchId: string;
  score: number;
  /** Set by the server when the household already has this movie. */
  inLibrary?: { id: string; title: string } | null;
}

export type RangePreset = "today" | "oct" | "nov" | "dec" | "novena" | "custom";

export interface CalendarState {
  season: number;
  preset: RangePreset;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD, always Dec 24 of the season. */
  endDate: string;
  /** date key → movie id */
  assignments: Record<string, string>;
  surprise: boolean;
}

export interface Settings {
  displayName: string;
}

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string };

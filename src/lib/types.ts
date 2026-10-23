import type { Avatar } from "./avatar";
import type { CountryCode } from "./countries";

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
  /** Profile ids; null on movies saved before profiles existed (or when the person left). */
  addedBy: string | null;
  suggestedBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate extends MovieData {
  justwatchId: string;
  score: number;
  /** Set by the server when the household already has this movie. */
  inLibrary?: { id: string; title: string } | null;
}

export type RangePreset = "today" | "nov" | "dec" | "custom";

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
  /** The household already chose its range (step 1); false shows the range picker first. */
  configured: boolean;
}

/** Serializable profile handed to client components. */
export interface Profile {
  id: string;
  name: string;
  avatar: Avatar;
  /** Belongs to someone's account; only that account can watch as it. */
  hasAccount: boolean;
}

export interface HomeInfo {
  id: string;
  name: string;
  inviteCode: string;
  country: CountryCode;
}

export interface AdminHome extends HomeInfo {
  accounts: number;
  profiles: number;
  movies: number;
  createdAt: string;
  lastActiveAt: string;
}

export interface AdminOverview {
  cap: number;
  homes: AdminHome[];
}

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string };

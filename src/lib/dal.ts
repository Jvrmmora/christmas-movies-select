import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { readSession } from "./session";
import { collections, type CalendarDoc, type MovieDoc } from "./db";
import { presetStart, seasonEnd, seasonFor } from "./calendar";
import type { CalendarState, Movie, Settings } from "./types";

/** Data Access Layer: every read checks the session first. */
export const verifySession = cache(async () => {
  const session = await readSession();
  if (!session) redirect("/login");
  return session;
});

export function toMovie(doc: MovieDoc): Movie {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    originalTitle: doc.originalTitle ?? "",
    year: doc.year,
    posterUrl: doc.posterUrl ?? "",
    backdropUrl: doc.backdropUrl ?? "",
    synopsis: doc.synopsis ?? "",
    genres: doc.genres ?? [],
    runtimeMinutes: doc.runtimeMinutes ?? null,
    trailerUrl: doc.trailerUrl ?? "",
    ratings: {
      imdb: doc.ratings?.imdb ?? null,
      imdbVotes: doc.ratings?.imdbVotes ?? null,
      rottenTomatoes: doc.ratings?.rottenTomatoes ?? null,
      certifiedFresh: !!doc.ratings?.certifiedFresh,
    },
    streaming: doc.streaming ?? [],
    externalIds: doc.externalIds ?? {},
    watched: !!doc.watched,
    watchedAt: doc.watchedAt ? doc.watchedAt.toISOString() : null,
    myRating: doc.myRating ?? null,
    notes: doc.notes ?? "",
    favorite: !!doc.favorite,
    source: doc.source ?? "manual",
    lastSyncedAt: doc.lastSyncedAt ? doc.lastSyncedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const getMovies = cache(async (): Promise<Movie[]> => {
  const { ownerId } = await verifySession();
  const { movies } = await collections();
  const docs = await movies.find({ ownerId }).sort({ createdAt: 1 }).toArray();
  return docs.map(toMovie);
});

export const getMovie = cache(async (id: string): Promise<Movie | null> => {
  const { ownerId } = await verifySession();
  if (!ObjectId.isValid(id)) return null;
  const { movies } = await collections();
  const doc = await movies.findOne({ _id: new ObjectId(id), ownerId });
  return doc ? toMovie(doc) : null;
});

export function defaultCalendar(season: number): CalendarState {
  return {
    season,
    preset: "dec",
    startDate: presetStart("dec", season, new Date()),
    endDate: seasonEnd(season),
    assignments: {},
    surprise: false,
  };
}

export function toCalendar(doc: CalendarDoc | null, season: number): CalendarState {
  if (!doc) return defaultCalendar(season);
  return {
    season: doc.season,
    preset: doc.preset,
    startDate: doc.startDate,
    endDate: doc.endDate,
    assignments: doc.assignments ?? {},
    surprise: !!doc.surprise,
  };
}

export const getCalendar = cache(async (): Promise<CalendarState> => {
  const { ownerId } = await verifySession();
  const season = seasonFor(new Date());
  const { calendars } = await collections();
  return toCalendar(await calendars.findOne({ ownerId, season }), season);
});

export const getSettings = cache(async (): Promise<Settings> => {
  const { ownerId } = await verifySession();
  const { settings } = await collections();
  const doc = await settings.findOne({ ownerId });
  return { displayName: doc?.displayName ?? "" };
});

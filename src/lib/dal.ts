import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { readAdminSession, readProfileSession, readSession } from "./session";
import { homeCap } from "./limits";
import { collections, type CalendarDoc, type MovieDoc, type ProfileDoc } from "./db";
import { normalizePreset, presetStart, seasonEnd, seasonFor } from "./calendar";
import type { AdminOverview, CalendarState, HomeInfo, Movie, Profile } from "./types";

/**
 * Data Access Layer: every read checks the session first.
 * ownerId is the home id: every movie, calendar and setting is stored under it.
 */
export const verifySession = cache(async () => {
  const session = await readSession();
  if (!session) redirect("/login");
  return { ownerId: session.homeId, homeId: session.homeId };
});

export function toProfile(doc: ProfileDoc): Profile {
  return { id: doc._id, name: doc.name, avatar: doc.avatar };
}

export const getHome = cache(async (): Promise<HomeInfo> => {
  const { homeId } = await verifySession();
  const { homes } = await collections();
  const home = await homes.findOne({ _id: homeId }, { projection: { slug: 1, name: 1 } });
  // A cookie for a home that was deleted: /salir clears it, otherwise /login would bounce straight back.
  if (!home) redirect("/salir");
  return { id: home._id, slug: home.slug, name: home.name };
});

export const getProfiles = cache(async (): Promise<Profile[]> => {
  const { homeId } = await verifySession();
  const { profiles } = await collections();
  return (await profiles.find({ homeId }).sort({ createdAt: 1 }).toArray()).map(toProfile);
});

/** Who is watching on this device, or the profile picker when nobody has been chosen (or they were removed). */
export const getCurrentProfile = cache(async (): Promise<Profile> => {
  const { homeId } = await verifySession();
  const picked = await readProfileSession();
  if (!picked || picked.homeId !== homeId) redirect("/perfiles");
  // Looked up in the (request-cached) list of the home's profiles: no extra query.
  const current = (await getProfiles()).find((p) => p.id === picked.profileId);
  if (!current) redirect("/perfiles");
  return current;
});

/** What ProfilesProvider needs; every page loader awaits this next to its own data. */
export const getProfileContext = cache(async () => {
  const [profiles, current] = await Promise.all([getProfiles(), getCurrentProfile()]);
  return { profiles, current };
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
    addedBy: doc.addedBy ?? null,
    suggestedBy: doc.suggestedBy ?? null,
    updatedBy: doc.updatedBy ?? null,
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
    configured: false,
  };
}

export function toCalendar(doc: CalendarDoc | null, season: number): CalendarState {
  if (!doc) return defaultCalendar(season);
  return {
    season: doc.season,
    preset: normalizePreset(doc.preset),
    startDate: doc.startDate,
    endDate: doc.endDate,
    assignments: doc.assignments ?? {},
    surprise: !!doc.surprise,
    // Calendars from before the range picker count as set up once they have any movie on a day.
    configured: !!doc.configuredAt || Object.keys(doc.assignments ?? {}).length > 0,
  };
}

export const getCalendar = cache(async (): Promise<CalendarState> => {
  const { ownerId } = await verifySession();
  const season = seasonFor(new Date());
  const { calendars } = await collections();
  return toCalendar(await calendars.findOne({ ownerId, season }), season);
});

/** Everything the admin panel shows; null when this browser has no admin session. */
export const getAdminOverview = cache(async (): Promise<AdminOverview | null> => {
  if (!(await readAdminSession())) return null;
  const { homes, profiles, movies } = await collections();
  const [homeDocs, profileCounts, movieCounts] = await Promise.all([
    homes.find({}, { projection: { passwordHash: 0, recoveryHash: 0 } }).sort({ createdAt: 1 }).toArray(),
    profiles.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$homeId", n: { $sum: 1 } } }]).toArray(),
    movies.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$ownerId", n: { $sum: 1 } } }]).toArray(),
  ]);
  const count = (rows: { _id: string; n: number }[]) => new Map(rows.map((r) => [r._id, r.n]));
  const profilesBy = count(profileCounts);
  const moviesBy = count(movieCounts);
  return {
    cap: homeCap(),
    homes: homeDocs.map((h) => ({
      id: h._id,
      slug: h.slug,
      name: h.name,
      profiles: profilesBy.get(h._id) ?? 0,
      movies: moviesBy.get(h._id) ?? 0,
      createdAt: h.createdAt.toISOString(),
      lastActiveAt: h.lastActiveAt.toISOString(),
    })),
  };
});

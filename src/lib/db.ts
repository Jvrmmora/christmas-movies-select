import "server-only";
import { MongoClient, type Collection, type ObjectId } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";
import type { Avatar } from "./avatar";
import type { CalendarState, MovieData, RangePreset } from "./types";

export interface MovieDoc extends MovieData {
  _id: ObjectId;
  ownerId: string;
  watched: boolean;
  watchedAt: Date | null;
  myRating: number | null;
  notes: string;
  favorite: boolean;
  source: "auto" | "manual";
  lastSyncedAt: Date | null;
  /** Profile ids; absent on movies saved before profiles existed. */
  addedBy?: string | null;
  suggestedBy?: string | null;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarDoc extends Omit<CalendarState, "preset" | "configured"> {
  _id?: ObjectId;
  ownerId: string;
  /** "oct" and "novena" are retired presets still found in older documents; read through `normalizePreset`. */
  preset: RangePreset | "oct" | "novena";
  /** Set when the range is saved from the range picker. */
  configuredAt?: Date;
  updatedAt: Date;
}

export interface SettingsDoc {
  _id?: ObjectId;
  ownerId: string;
  displayName: string;
  updatedAt: Date;
}

/** A household: owns movies/calendars/settings through ownerId (= its _id). */
export interface HomeDoc {
  _id: string;
  slug: string;
  name: string;
  passwordHash: string;
  recoveryHash: string;
  /** Only on homes created back when sign-up needed an invite. */
  inviteCode?: string | null;
  createdAt: Date;
  lastActiveAt: Date;
}

/** A person inside a home: no password, picked on the "who's watching" screen. */
export interface ProfileDoc {
  _id: string;
  homeId: string;
  name: string;
  avatar: Avatar;
  createdAt: Date;
}

export interface RateLimitDoc {
  _id: string;
  count: number;
  expiresAt: Date;
}

const globalForMongo = globalThis as unknown as {
  mongoClient?: Promise<MongoClient>;
  mongoIndexes?: Promise<void>;
};

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Falta la variable de entorno MONGODB_URI");
  const client = new MongoClient(uri, { maxIdleTimeMS: 10_000, serverSelectionTimeoutMS: 10_000 });
  attachDatabasePool(client);
  return client.connect();
}

export async function getDb() {
  globalForMongo.mongoClient ??= connect();
  const client = await globalForMongo.mongoClient.catch((err) => {
    globalForMongo.mongoClient = undefined;
    throw err;
  });
  return client.db(process.env.MONGODB_DB || "christmas-movies");
}

export async function collections() {
  const db = await getDb();
  const movies: Collection<MovieDoc> = db.collection<MovieDoc>("movies");
  const calendars: Collection<CalendarDoc> = db.collection<CalendarDoc>("calendars");
  const settings: Collection<SettingsDoc> = db.collection<SettingsDoc>("settings");
  const homes: Collection<HomeDoc> = db.collection<HomeDoc>("homes");
  const profiles: Collection<ProfileDoc> = db.collection<ProfileDoc>("profiles");
  const rateLimits: Collection<RateLimitDoc> = db.collection<RateLimitDoc>("rate_limits");
  globalForMongo.mongoIndexes ??= Promise.all([
    movies.createIndex({ ownerId: 1, title: 1, year: 1 }, { unique: true, name: "owner_title_year" }),
    movies.createIndex({ ownerId: 1, createdAt: -1 }),
    calendars.createIndex({ ownerId: 1, season: 1 }, { unique: true }),
    settings.createIndex({ ownerId: 1 }, { unique: true }),
    homes.createIndex({ slug: 1 }, { unique: true }),
    profiles.createIndex({ homeId: 1, createdAt: 1 }),
    // Expired windows disappear on their own; no cron needed.
    rateLimits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]).then(() => undefined);
  await globalForMongo.mongoIndexes;
  return { movies, calendars, settings, homes, profiles, rateLimits };
}

/**
 * The household that existed before multi-home support. Its _id doubles as the ownerId on the
 * original movies/calendars, so migrating it needs no data rewrite.
 */
export const LEGACY_HOME_ID = "household";

import "server-only";
import { MongoClient, type Collection, type ObjectId } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarDoc extends Omit<CalendarState, "preset"> {
  _id?: ObjectId;
  ownerId: string;
  preset: RangePreset;
  updatedAt: Date;
}

export interface SettingsDoc {
  _id?: ObjectId;
  ownerId: string;
  displayName: string;
  updatedAt: Date;
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
  globalForMongo.mongoIndexes ??= Promise.all([
    movies.createIndex({ ownerId: 1, title: 1, year: 1 }, { unique: true, name: "owner_title_year" }),
    movies.createIndex({ ownerId: 1, createdAt: -1 }),
    calendars.createIndex({ ownerId: 1, season: 1 }, { unique: true }),
    settings.createIndex({ ownerId: 1 }, { unique: true }),
  ]).then(() => undefined);
  await globalForMongo.mongoIndexes;
  return { movies, calendars, settings };
}

/** Single household for now; every document carries ownerId for a future multi-user setup. */
export const DEFAULT_OWNER = "household";

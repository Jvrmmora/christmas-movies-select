"use server";

import { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { collections, type MovieDoc } from "@/lib/db";
import { seasonFor } from "@/lib/calendar";
import { LIMITS, RATE_RULES } from "@/lib/limits";
import { tooManyAttempts } from "@/lib/rate-limit";
import { limiter } from "@/lib/rate-limit-store";
import { getHomeCountry } from "@/lib/homes";
import { enrich, fetchLatest, lookupMovie } from "@/lib/metadata";
import { getLibraryIndex } from "@/lib/library";
import { findInLibrary } from "@/lib/library-match";
import { firstIssue, movieInputSchema, type MovieInput, type MovieInputParsed } from "@/lib/validation";
import type { ActionResult, Candidate } from "@/lib/types";
import { errorMessage, requireOwner, requireProfile } from "./guard";

function oid(id: string): ObjectId {
  if (!ObjectId.isValid(id)) throw new Error("Película no encontrada");
  return new ObjectId(id);
}

function toDocFields(input: MovieInputParsed) {
  // suggestedBy is resolved separately: undefined must mean "leave as is", not "set to null".
  const { calendarDate: _calendarDate, suggestedBy: _suggestedBy, ...rest } = input;
  return {
    ...rest,
    watchedAt: input.watched ? new Date() : null,
  };
}

const FULL_LIBRARY = `Tu casa llegó al máximo de ${LIMITS.moviesPerHome} películas. Elimina alguna para agregar más.`;

/** The profile that suggested a movie must belong to this very home. */
async function profileInHome(ownerId: string, profileId: string): Promise<boolean> {
  const { profiles } = await collections();
  return (await profiles.countDocuments({ _id: profileId, homeId: ownerId }, { limit: 1 })) > 0;
}

async function assignToCalendar(ownerId: string, movieId: string, date: string | null | undefined) {
  if (date === undefined) return;
  const { calendars } = await collections();
  const season = seasonFor(new Date());
  const doc = await calendars.findOne({ ownerId, season });
  const assignments = { ...(doc?.assignments ?? {}) };
  for (const [key, id] of Object.entries(assignments)) if (id === movieId) delete assignments[key];
  if (date) assignments[date] = movieId;
  await calendars.updateOne(
    { ownerId, season },
    {
      $set: { assignments, updatedAt: new Date() },
      $setOnInsert: { preset: "dec", startDate: `${season}-12-01`, endDate: `${season}-12-24`, surprise: false },
    },
    { upsert: true },
  );
}

export async function searchMoviesAction(title: string, year?: number, ignoreId?: string): Promise<ActionResult<Candidate[]>> {
  try {
    const ownerId = await requireOwner();
    const q = String(title ?? "").trim().slice(0, 200);
    if (!q) return { ok: false, error: "Escribe el nombre de la película" };
    // Every search hits JustWatch (and OMDb, whose free key is small), so each home gets an hourly budget.
    const budget = await limiter.hit(`search:${ownerId}`, RATE_RULES.search);
    if (!budget.allowed) return { ok: false, error: tooManyAttempts(budget.resetsAt) };
    const y = year && Number.isInteger(year) && year > 1880 && year < 2100 ? year : undefined;
    const country = await getHomeCountry(ownerId);
    const [candidates, library] = await Promise.all([lookupMovie(q, y, country), getLibraryIndex(ownerId)]);
    // Flag what is already in the library so the form can block it.
    const flagged = candidates.map((c) => ({ ...c, inLibrary: findInLibrary(library, c, ignoreId) }));
    return { ok: true, data: flagged };
  } catch (err) {
    return { ok: false, error: errorMessage(err, "No pudimos buscar la película.") };
  }
}

export async function createMovieAction(raw: MovieInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { ownerId, profileId } = await requireProfile();
    const parsed = movieInputSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const { movies } = await collections();
    if ((await movies.countDocuments({ ownerId })) >= LIMITS.moviesPerHome) return { ok: false, error: FULL_LIBRARY };
    const dup = findInLibrary(await getLibraryIndex(ownerId), parsed.data);
    if (dup) return { ok: false, error: `Ya lo tienes en tu biblioteca: «${dup.title}».` };
    const suggestedBy = parsed.data.suggestedBy === undefined ? profileId : parsed.data.suggestedBy;
    if (suggestedBy && !(await profileInHome(ownerId, suggestedBy))) return { ok: false, error: "Ese perfil ya no existe." };
    const input = await enrich(parsed.data);
    const now = new Date();
    const doc: Omit<MovieDoc, "_id"> = {
      ...toDocFields(input),
      ownerId,
      addedBy: profileId,
      suggestedBy,
      updatedBy: profileId,
      lastSyncedAt: input.source === "auto" ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    const res = await movies.insertOne(doc as MovieDoc);
    const id = res.insertedId.toHexString();
    await assignToCalendar(ownerId, id, input.calendarDate);
    refresh();
    return { ok: true, data: { id } };
  } catch (err) {
    return { ok: false, error: errorMessage(err, "No pudimos guardar la película.") };
  }
}

export async function updateMovieAction(id: string, raw: MovieInput): Promise<ActionResult> {
  try {
    const { ownerId, profileId } = await requireProfile();
    const parsed = movieInputSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const { movies } = await collections();
    const current = await movies.findOne({ _id: oid(id), ownerId });
    if (!current) return { ok: false, error: "Película no encontrada" };
    const fields = toDocFields(parsed.data);
    // Keep the original "watched" date when it stays watched.
    if (current.watched && fields.watched) fields.watchedAt = current.watchedAt;
    const { suggestedBy } = parsed.data;
    if (suggestedBy && !(await profileInHome(ownerId, suggestedBy))) return { ok: false, error: "Ese perfil ya no existe." };
    await movies.updateOne(
      { _id: current._id },
      { $set: { ...fields, ...(suggestedBy !== undefined && { suggestedBy }), updatedBy: profileId, updatedAt: new Date() } },
    );
    await assignToCalendar(ownerId, id, parsed.data.calendarDate);
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err, "No pudimos guardar los cambios.") };
  }
}

export async function deleteMovieAction(id: string): Promise<ActionResult> {
  try {
    const ownerId = await requireOwner();
    const { movies, calendars } = await collections();
    const res = await movies.deleteOne({ _id: oid(id), ownerId });
    if (!res.deletedCount) return { ok: false, error: "Película no encontrada" };
    // Free any calendar day that pointed to it.
    const cals = await calendars.find({ ownerId }).toArray();
    for (const cal of cals) {
      const next = Object.fromEntries(Object.entries(cal.assignments ?? {}).filter(([, v]) => v !== id));
      if (Object.keys(next).length !== Object.keys(cal.assignments ?? {}).length) {
        await calendars.updateOne({ _id: cal._id }, { $set: { assignments: next, updatedAt: new Date() } });
      }
    }
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err, "No pudimos eliminar la película.") };
  }
}

/** `stamp` records who made the change; plain toggles (watched, favorite, rating) don't count as edits. */
async function patchMovie(id: string, set: Partial<MovieDoc>, stamp = false): Promise<ActionResult> {
  try {
    const { ownerId, profileId } = stamp ? await requireProfile() : { ownerId: await requireOwner(), profileId: null };
    const { movies } = await collections();
    const res = await movies.updateOne(
      { _id: oid(id), ownerId },
      { $set: { ...set, ...(profileId && { updatedBy: profileId }), updatedAt: new Date() } },
    );
    if (!res.matchedCount) return { ok: false, error: "Película no encontrada" };
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function setWatchedAction(id: string, watched: boolean): Promise<ActionResult> {
  return patchMovie(id, { watched: !!watched, watchedAt: watched ? new Date() : null });
}

export async function setFavoriteAction(id: string, favorite: boolean): Promise<ActionResult> {
  return patchMovie(id, { favorite: !!favorite });
}

export async function setMyRatingAction(id: string, rating: number | null): Promise<ActionResult> {
  const value = rating && Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
  return patchMovie(id, { myRating: value });
}

export async function setNotesAction(id: string, notes: string): Promise<ActionResult> {
  return patchMovie(id, { notes: String(notes ?? "").trim().slice(0, 2000) }, true);
}

/** Re-fetches ratings, artwork and availability in the home's country. Keeps the user's title and notes. */
export async function refreshMetadataAction(id: string): Promise<ActionResult> {
  try {
    const ownerId = await requireOwner();
    const { movies } = await collections();
    const doc = await movies.findOne({ _id: oid(id), ownerId });
    if (!doc) return { ok: false, error: "Película no encontrada" };
    const latest = await fetchLatest(doc.externalIds?.justwatchId, doc.originalTitle || doc.title, doc.year, await getHomeCountry(ownerId));
    if (!latest) return { ok: false, error: "No encontramos datos nuevos para esta película." };
    await movies.updateOne(
      { _id: doc._id },
      {
        $set: {
          posterUrl: doc.posterUrl || latest.posterUrl,
          backdropUrl: latest.backdropUrl || doc.backdropUrl,
          synopsis: doc.synopsis || latest.synopsis,
          genres: doc.genres?.length ? doc.genres : latest.genres,
          runtimeMinutes: doc.runtimeMinutes ?? latest.runtimeMinutes,
          ratings: latest.ratings,
          streaming: latest.streaming,
          externalIds: { ...doc.externalIds, ...latest.externalIds },
          trailerUrl: doc.trailerUrl || latest.trailerUrl,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err, "No pudimos actualizar los datos.") };
  }
}

export async function importMoviesAction(items: MovieInput[]): Promise<ActionResult<{ created: number; skipped: string[] }>> {
  try {
    const { ownerId, profileId } = await requireProfile();
    if (!Array.isArray(items) || !items.length) return { ok: false, error: "No hay películas para importar" };
    if (items.length > 100) return { ok: false, error: "Máximo 100 películas por importación" };
    const { movies } = await collections();
    const library = await getLibraryIndex(ownerId);
    let room = LIMITS.moviesPerHome - (await movies.countDocuments({ ownerId }));
    if (room <= 0) return { ok: false, error: FULL_LIBRARY };
    let created = 0;
    const skipped: string[] = [];
    for (const raw of items) {
      if (room <= 0) {
        skipped.push(`${String(raw?.title ?? "?")}: la casa llegó al máximo de ${LIMITS.moviesPerHome} películas`);
        continue;
      }
      const parsed = movieInputSchema.safeParse(raw);
      if (!parsed.success) {
        skipped.push(`${String(raw?.title ?? "?")}: ${firstIssue(parsed.error)}`);
        continue;
      }
      const dup = findInLibrary(library, parsed.data);
      if (dup) {
        skipped.push(`${parsed.data.title} (${parsed.data.year}): ya lo tienes en tu biblioteca`);
        continue;
      }
      const input = await enrich(parsed.data);
      const now = new Date();
      try {
        await movies.insertOne({
          ...toDocFields(input),
          ownerId,
          addedBy: profileId,
          suggestedBy: profileId,
          updatedBy: profileId,
          lastSyncedAt: input.source === "auto" ? now : null,
          createdAt: now,
          updatedAt: now,
        } as MovieDoc);
        created++;
        room--;
      } catch (err) {
        skipped.push(`${input.title} (${input.year}): ${errorMessage(err)}`);
      }
    }
    refresh();
    return { ok: true, data: { created, skipped } };
  } catch (err) {
    return { ok: false, error: errorMessage(err, "No pudimos importar la lista.") };
  }
}

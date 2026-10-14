"use server";

import { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { collections } from "@/lib/db";
import { presetStart, seasonEnd, seasonFor } from "@/lib/calendar";
import { calendarPatchSchema, firstIssue, type CalendarPatch } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";
import { errorMessage, requireOwner } from "./guard";

export async function saveCalendarAction(raw: CalendarPatch): Promise<ActionResult> {
  try {
    const ownerId = await requireOwner();
    const parsed = calendarPatchSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const patch = parsed.data;
    const season = seasonFor(new Date());
    const end = seasonEnd(season);
    const { calendars, movies } = await collections();

    const set: Record<string, unknown> = { updatedAt: new Date(), endDate: end };
    if (patch.preset) set.preset = patch.preset;
    // The client computes the start in the household's own timezone; the server only clamps it.
    const start = patch.startDate ?? (patch.preset ? presetStart(patch.preset, season, new Date()) : undefined);
    if (start) set.startDate = start > end ? end : start < `${season - 1}-12-25` ? `${season}-10-01` : start;
    if (patch.surprise !== undefined) set.surprise = patch.surprise;
    if (patch.assignments) {
      // Only this household's movies, only this season, one day per movie.
      const ids = [...new Set(Object.values(patch.assignments))];
      const owned = await movies
        .find({ ownerId, _id: { $in: ids.map((id) => new ObjectId(id)) } }, { projection: { _id: 1 } })
        .toArray();
      const ownedSet = new Set(owned.map((m) => m._id.toHexString()));
      const seen = new Set<string>();
      const clean: Record<string, string> = {};
      for (const [key, id] of Object.entries(patch.assignments).sort(([a], [b]) => a.localeCompare(b))) {
        if (!key.startsWith(`${season}-`) || key > end || !ownedSet.has(id) || seen.has(id)) continue;
        seen.add(id);
        clean[key] = id;
      }
      set.assignments = clean;
    }

    await calendars.updateOne(
      { ownerId, season },
      {
        $set: set,
        $setOnInsert: {
          ...(set.preset ? {} : { preset: "dec" }),
          ...(set.startDate ? {} : { startDate: `${season}-12-01` }),
          ...(set.assignments ? {} : { assignments: {} }),
          ...(set.surprise !== undefined ? {} : { surprise: false }),
        },
      },
      { upsert: true },
    );
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err, "No pudimos guardar el calendario.") };
  }
}

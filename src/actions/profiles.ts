"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { collections } from "@/lib/db";
import { LIMITS } from "@/lib/limits";
import { createProfileSession, readProfileSession, deleteProfileSession } from "@/lib/session";
import type { ActionResult } from "@/lib/types";
import { firstIssue, profileInputSchema, type ProfileInput } from "@/lib/validation";
import { errorMessage, requireOwner } from "./guard";

const FULL = `Cada casa puede tener hasta ${LIMITS.profilesPerHome} perfiles.`;

async function selectInternal(homeId: string, profileId: string) {
  const { homes } = await collections();
  await createProfileSession({ homeId, profileId });
  await homes.updateOne({ _id: homeId }, { $set: { lastActiveAt: new Date() } });
}

/** Remembers who is watching on this device. */
export async function selectProfileAction(profileId: string): Promise<ActionResult> {
  try {
    const homeId = await requireOwner();
    const { profiles } = await collections();
    if (!(await profiles.countDocuments({ _id: String(profileId), homeId }, { limit: 1 }))) {
      return { ok: false, error: "Ese perfil ya no existe." };
    }
    await selectInternal(homeId, String(profileId));
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/** `select` makes the new profile the one watching (used for the first profile of a home). */
export async function createProfileAction(input: ProfileInput, select = false): Promise<ActionResult<{ id: string }>> {
  try {
    const homeId = await requireOwner();
    const parsed = profileInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

    const { profiles } = await collections();
    if ((await profiles.countDocuments({ homeId })) >= LIMITS.profilesPerHome) return { ok: false, error: FULL };

    const id = randomUUID();
    await profiles.insertOne({ _id: id, homeId, name: parsed.data.name, avatar: parsed.data.avatar, createdAt: new Date() });
    // Two profiles created at once could both pass the check above; the later one gives way.
    if ((await profiles.countDocuments({ homeId })) > LIMITS.profilesPerHome) {
      await profiles.deleteOne({ _id: id });
      return { ok: false, error: FULL };
    }
    if (select) await selectInternal(homeId, id);
    refresh();
    return { ok: true, data: { id } };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function updateProfileAction(profileId: string, input: ProfileInput): Promise<ActionResult> {
  try {
    const homeId = await requireOwner();
    const parsed = profileInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const { profiles } = await collections();
    const res = await profiles.updateOne(
      { _id: String(profileId), homeId },
      { $set: { name: parsed.data.name, avatar: parsed.data.avatar } },
    );
    if (!res.matchedCount) return { ok: false, error: "Ese perfil ya no existe." };
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/** Movies keep the id they were stamped with; the UI shows a neutral avatar for people who left. */
export async function deleteProfileAction(profileId: string): Promise<ActionResult> {
  try {
    const homeId = await requireOwner();
    const { profiles } = await collections();
    if ((await profiles.countDocuments({ homeId })) <= 1) {
      return { ok: false, error: "La casa necesita al menos un perfil." };
    }
    const res = await profiles.deleteOne({ _id: String(profileId), homeId });
    if (!res.deletedCount) return { ok: false, error: "Ese perfil ya no existe." };
    const picked = await readProfileSession();
    if (picked?.homeId === homeId && picked.profileId === profileId) await deleteProfileSession();
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

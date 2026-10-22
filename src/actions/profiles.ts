"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { collections, type ProfileDoc } from "@/lib/db";
import { LIMITS } from "@/lib/limits";
import { createProfileSession, readProfileSession, deleteProfileSession } from "@/lib/session";
import type { ActionResult } from "@/lib/types";
import { firstIssue, profileInputSchema, type ProfileInput } from "@/lib/validation";
import { errorMessage, requireUser, UnauthorizedError } from "./guard";

const FULL = `Cada casa puede tener hasta ${LIMITS.profilesPerHome} perfiles.`;
const GONE = "Ese perfil ya no existe.";
const NOT_YOURS = "Ese perfil es de otra persona: solo ella puede usarlo o cambiarlo.";

async function requireHome(): Promise<{ userId: string; homeId: string }> {
  const { userId, homeId } = await requireUser();
  if (!homeId) throw new UnauthorizedError("Primero crea una casa o únete a una.");
  return { userId, homeId };
}

/** Loose profiles (kids, guests) are open to everyone in the home; a profile with an account only to that account. */
const usableBy = (profile: Pick<ProfileDoc, "userId">, userId: string) => !profile.userId || profile.userId === userId;

async function selectInternal(homeId: string, profileId: string) {
  const { homes } = await collections();
  await createProfileSession({ homeId, profileId });
  await homes.updateOne({ _id: homeId }, { $set: { lastActiveAt: new Date() } });
}

/** Remembers who is watching on this device. */
export async function selectProfileAction(profileId: string): Promise<ActionResult> {
  try {
    const { userId, homeId } = await requireHome();
    const { profiles } = await collections();
    const profile = await profiles.findOne({ _id: String(profileId), homeId }, { projection: { userId: 1 } });
    if (!profile) return { ok: false, error: GONE };
    if (!usableBy(profile, userId)) return { ok: false, error: NOT_YOURS };
    await selectInternal(homeId, String(profileId));
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/**
 * `own` makes it this account's profile and the one watching (the "create mine" step after joining a home);
 * otherwise it is a loose profile for someone without an account.
 */
export async function createProfileAction(input: ProfileInput, own = false): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId, homeId } = await requireHome();
    const parsed = profileInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

    const { profiles } = await collections();
    if ((await profiles.countDocuments({ homeId })) >= LIMITS.profilesPerHome) return { ok: false, error: FULL };

    const id = randomUUID();
    try {
      await profiles.insertOne({
        _id: id,
        homeId,
        name: parsed.data.name,
        avatar: parsed.data.avatar,
        ...(own ? { userId } : {}),
        createdAt: new Date(),
      });
    } catch (err) {
      // The unique { homeId, userId } index: this account already has its profile here.
      if (own && err && typeof err === "object" && "code" in err && err.code === 11000) {
        return { ok: false, error: "Ya tienes tu perfil en esta casa." };
      }
      throw err;
    }
    // Two profiles created at once could both pass the check above; the later one gives way.
    if ((await profiles.countDocuments({ homeId })) > LIMITS.profilesPerHome) {
      await profiles.deleteOne({ _id: id });
      return { ok: false, error: FULL };
    }
    if (own) await selectInternal(homeId, id);
    refresh();
    return { ok: true, data: { id } };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/** "Soy yo": takes over a loose profile (one made before this person had an account) as their own. */
export async function claimProfileAction(profileId: string): Promise<ActionResult> {
  try {
    const { userId, homeId } = await requireHome();
    const { profiles } = await collections();
    if (await profiles.countDocuments({ homeId, userId }, { limit: 1 })) return { ok: false, error: "Ya tienes tu perfil en esta casa." };
    // Only while it is still loose, so two people can't claim the same profile.
    const res = await profiles.updateOne({ _id: String(profileId), homeId, userId: { $exists: false } }, { $set: { userId } });
    if (!res.modifiedCount) return { ok: false, error: "Ese perfil ya lo tomó otra persona o ya no existe." };
    await selectInternal(homeId, String(profileId));
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function updateProfileAction(profileId: string, input: ProfileInput): Promise<ActionResult> {
  try {
    const { userId, homeId } = await requireHome();
    const parsed = profileInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const { profiles } = await collections();
    const profile = await profiles.findOne({ _id: String(profileId), homeId }, { projection: { userId: 1 } });
    if (!profile) return { ok: false, error: GONE };
    if (!usableBy(profile, userId)) return { ok: false, error: NOT_YOURS };
    await profiles.updateOne({ _id: profile._id }, { $set: { name: parsed.data.name, avatar: parsed.data.avatar } });
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/** Only loose profiles can be removed: a profile with an account is that person's place in the home. */
export async function deleteProfileAction(profileId: string): Promise<ActionResult> {
  try {
    const { homeId } = await requireHome();
    const { profiles } = await collections();
    const profile = await profiles.findOne({ _id: String(profileId), homeId }, { projection: { userId: 1 } });
    if (!profile) return { ok: false, error: GONE };
    if (profile.userId) return { ok: false, error: "Ese perfil tiene su propia cuenta y no se puede eliminar." };
    if ((await profiles.countDocuments({ homeId })) <= 1) {
      return { ok: false, error: "La casa necesita al menos un perfil." };
    }
    // Movies keep the id they were stamped with; the UI shows a neutral avatar for people who left.
    await profiles.deleteOne({ _id: profile._id });
    const picked = await readProfileSession();
    if (picked?.homeId === homeId && picked.profileId === profileId) await deleteProfileSession();
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

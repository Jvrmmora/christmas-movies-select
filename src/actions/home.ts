"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { clientIp } from "@/lib/client-ip";
import { collections } from "@/lib/db";
import { generateInviteCode, normalizeInviteCode } from "@/lib/invite-code";
import { homeCap, LIMITS, RATE_RULES } from "@/lib/limits";
import { tooManyAttempts } from "@/lib/rate-limit";
import { limiter } from "@/lib/rate-limit-store";
import { createSession, deleteProfileSession } from "@/lib/session";
import type { ActionResult } from "@/lib/types";
import { firstIssue, homeNameSchema } from "@/lib/validation";
import { errorMessage, requireOwner, requireUser } from "./guard";

export interface HomeFormState {
  error?: string;
}

const FULL = "Por ahora no hay lugar para más casas. Intenten más tarde.";
const HAS_HOME = "Ya perteneces a una casa.";
const BAD_CODE = "Ese código de invitación no existe o ya lo cambiaron. Pide el más reciente.";

const isDuplicate = (err: unknown) => !!err && typeof err === "object" && "code" in err && err.code === 11000;

/** Inserts with a fresh invite code, trying again in the (very unlikely) case it is already taken. */
async function withFreshInviteCode(write: (code: string) => Promise<unknown>): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    const code = generateInviteCode();
    try {
      await write(code);
      return code;
    } catch (err) {
      if (!isDuplicate(err) || attempt >= 4) throw err;
    }
  }
}

/** Points the account at its home. Only works while it has none, so two tabs can't end up in two homes. */
async function moveIn(userId: string, homeId: string): Promise<boolean> {
  const { users } = await collections();
  const res = await users.updateOne({ _id: userId, homeId: null }, { $set: { homeId, lastActiveAt: new Date() } });
  if (!res.modifiedCount) return false;
  // A profile picked in a previous home must not follow the account here.
  await deleteProfileSession();
  await createSession({ userId, homeId });
  return true;
}

/** Step 2a: a new home, named by the person. Protected by a per-IP daily limit and the global HOME_CAP. */
export async function createHomeAction(_prev: HomeFormState, formData: FormData): Promise<HomeFormState> {
  const name = homeNameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: firstIssue(name.error) };

  try {
    const { userId, homeId: current } = await requireUser();
    if (current) return { error: HAS_HOME };

    const ipKey = `create-home:${await clientIp()}`;
    const gate = await limiter.isBlocked(ipKey, RATE_RULES.createHome);
    if (!gate.allowed) return { error: tooManyAttempts(gate.resetsAt) };

    const { homes } = await collections();
    if ((await homes.countDocuments()) >= homeCap()) return { error: FULL };

    const now = new Date();
    const homeId = randomUUID();
    await withFreshInviteCode((inviteCode) =>
      homes.insertOne({ _id: homeId, name: name.data, inviteCode, createdBy: userId, createdAt: now, lastActiveAt: now }),
    );
    // Concurrent sign-ups could slip past the earlier check; settle it after the fact.
    if ((await homes.countDocuments()) > homeCap()) {
      await homes.deleteOne({ _id: homeId });
      return { error: FULL };
    }
    if (!(await moveIn(userId, homeId))) {
      await homes.deleteOne({ _id: homeId });
      return { error: HAS_HOME };
    }
    await limiter.hit(ipKey, RATE_RULES.createHome);
  } catch (err) {
    return { error: errorMessage(err, "No se pudo crear la casa. Intenta de nuevo.") };
  }
  redirect("/perfiles");
}

/** Step 2b: join an existing home with its invite code (typed, or carried over from /unirse/<code>). */
export async function joinHomeAction(_prev: HomeFormState, formData: FormData): Promise<HomeFormState> {
  try {
    const { userId, homeId: current } = await requireUser();
    if (current) return { error: HAS_HOME };

    const key = `join:${await clientIp()}`;
    const gate = await limiter.isBlocked(key, RATE_RULES.join);
    if (!gate.allowed) return { error: tooManyAttempts(gate.resetsAt) };

    const code = normalizeInviteCode(String(formData.get("code") ?? ""));
    const { homes, users, profiles } = await collections();
    const home = code ? await homes.findOne({ inviteCode: code }, { projection: { _id: 1 } }) : null;
    if (!home) {
      await limiter.hit(key, RATE_RULES.join);
      await new Promise((r) => setTimeout(r, 600));
      return { error: BAD_CODE };
    }

    // Room means a profile slot for the newcomer: a free one, or a loose profile they can claim as theirs.
    const [members, total, loose] = await Promise.all([
      users.countDocuments({ homeId: home._id }),
      profiles.countDocuments({ homeId: home._id }),
      profiles.countDocuments({ homeId: home._id, userId: { $exists: false } }),
    ]);
    if (members >= LIMITS.profilesPerHome || (total >= LIMITS.profilesPerHome && loose === 0)) {
      return { error: `Esa casa ya está llena: cada casa puede tener hasta ${LIMITS.profilesPerHome} perfiles.` };
    }

    await limiter.reset(key);
    if (!(await moveIn(userId, home._id))) return { error: HAS_HOME };
  } catch (err) {
    return { error: errorMessage(err, "No pudimos unirte a la casa. Intenta de nuevo.") };
  }
  redirect("/perfiles");
}

/** A new invite code for the home; the old one (and its link) stops working at once. */
export async function regenerateInviteAction(): Promise<ActionResult<{ inviteCode: string }>> {
  try {
    const homeId = await requireOwner();
    const { homes } = await collections();
    const inviteCode = await withFreshInviteCode((code) => homes.updateOne({ _id: homeId }, { $set: { inviteCode: code } }));
    refresh();
    return { ok: true, data: { inviteCode } };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

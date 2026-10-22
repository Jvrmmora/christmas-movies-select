"use server";

import { refresh } from "next/cache";
import { collections } from "@/lib/db";
import { RATE_RULES } from "@/lib/limits";
import { hashSecret, verifySecret } from "@/lib/password";
import { tooManyAttempts } from "@/lib/rate-limit";
import { limiter } from "@/lib/rate-limit-store";
import { emailSchema, firstIssue, homeNameSchema, passwordSchema } from "@/lib/validation";
import { errorMessage, requireOwner, requireUser } from "./guard";

export interface SettingsState {
  error?: string;
  /** Bumped on every success, so the form can tell a new "saved" apart from the previous one. */
  saved?: number;
}

const isDuplicate = (err: unknown) => !!err && typeof err === "object" && "code" in err && err.code === 11000;

/** The home's name, as everyone in it sees it. */
export async function updateHomeAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  try {
    const homeId = await requireOwner();
    const name = homeNameSchema.safeParse(formData.get("name"));
    if (!name.success) return { error: firstIssue(name.error) };
    const { homes } = await collections();
    await homes.updateOne({ _id: homeId }, { $set: { name: name.data } });
    refresh();
    return { saved: Date.now() };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

/** Checks the current password before touching the account: it is the key to everything else. */
async function checkCurrentPassword(userId: string, password: FormDataEntryValue | null): Promise<string | null> {
  const key = `settings:${userId}`;
  const gate = await limiter.isBlocked(key, RATE_RULES.settings);
  if (!gate.allowed) return tooManyAttempts(gate.resetsAt);

  const { users } = await collections();
  const user = await users.findOne({ _id: userId }, { projection: { passwordHash: 1 } });
  if (!user || !(await verifySecret(String(password ?? ""), user.passwordHash))) {
    await limiter.hit(key, RATE_RULES.settings);
    return "La clave actual no coincide.";
  }
  await limiter.reset(key);
  return null;
}

/** The address this account signs in with and receives "forgot my password" codes at. */
export async function updateEmailAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  try {
    const { userId } = await requireUser();
    const email = emailSchema.safeParse(formData.get("email"));
    if (!email.success) return { error: firstIssue(email.error) };
    const wrong = await checkCurrentPassword(userId, formData.get("password"));
    if (wrong) return { error: wrong };

    const { users } = await collections();
    try {
      await users.updateOne({ _id: userId }, { $set: { email: email.data }, $unset: { reset: "" } });
    } catch (err) {
      if (isDuplicate(err)) return { error: "Ese correo ya lo usa otra cuenta." };
      throw err;
    }
    refresh();
    return { saved: Date.now() };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

export async function updatePasswordAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  try {
    const { userId } = await requireUser();
    const next = passwordSchema.safeParse(formData.get("newPassword"));
    if (!next.success) return { error: firstIssue(next.error) };
    const wrong = await checkCurrentPassword(userId, formData.get("password"));
    if (wrong) return { error: wrong };

    const { users } = await collections();
    await users.updateOne({ _id: userId }, { $set: { passwordHash: await hashSecret(next.data) }, $unset: { reset: "" } });
    return { saved: Date.now() };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

"use server";

import { refresh } from "next/cache";
import { collections } from "@/lib/db";
import { RATE_RULES } from "@/lib/limits";
import { verifySecret } from "@/lib/password";
import { tooManyAttempts } from "@/lib/rate-limit";
import { limiter } from "@/lib/rate-limit-store";
import { firstIssue, homeEmailSchema, homeSettingsSchema } from "@/lib/validation";
import { errorMessage, requireOwner } from "./guard";

export interface SettingsState {
  error?: string;
  /** Bumped on every success, so the form can tell a new "saved" apart from the previous one. */
  saved?: number;
  slug?: string;
}

const isDuplicate = (err: unknown) => !!err && typeof err === "object" && "code" in err && err.code === 11000;

/** Name and sign-in code. The code is unique across homes; the old one stops working at once. */
export async function updateHomeAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  try {
    const homeId = await requireOwner();
    const parsed = homeSettingsSchema.safeParse({ name: formData.get("name"), slug: formData.get("slug") });
    if (!parsed.success) return { error: firstIssue(parsed.error) };

    const { homes } = await collections();
    try {
      await homes.updateOne({ _id: homeId }, { $set: parsed.data });
    } catch (err) {
      // The unique index on slug decides, so two families can never end up with the same code.
      if (isDuplicate(err)) return { error: "Ese código de casa ya lo usa otra familia. Prueba con otro." };
      throw err;
    }
    refresh();
    return { saved: Date.now(), slug: parsed.data.slug };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

/** The address that receives the "forgot my password" code. Asks for the current password: it is the key to the account. */
export async function updateEmailAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  try {
    const homeId = await requireOwner();
    const email = homeEmailSchema.safeParse(formData.get("email"));
    if (!email.success) return { error: firstIssue(email.error) };

    const key = `settings:${homeId}`;
    const gate = await limiter.isBlocked(key, RATE_RULES.settings);
    if (!gate.allowed) return { error: tooManyAttempts(gate.resetsAt) };

    const { homes } = await collections();
    const home = await homes.findOne({ _id: homeId }, { projection: { passwordHash: 1 } });
    if (!home || !(await verifySecret(String(formData.get("password") ?? ""), home.passwordHash))) {
      await limiter.hit(key, RATE_RULES.settings);
      return { error: "La clave actual no coincide." };
    }
    await limiter.reset(key);

    try {
      await homes.updateOne({ _id: homeId }, { $set: { email: email.data }, $unset: { reset: "" } });
    } catch (err) {
      if (isDuplicate(err)) return { error: "Ese correo ya está registrado en otra casa." };
      throw err;
    }
    refresh();
    return { saved: Date.now() };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

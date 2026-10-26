"use server";

import { refresh } from "next/cache";
import { collections } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/jwt";
import type { ActionResult } from "@/lib/types";
import { errorMessage, requireUser } from "./guard";

/** Turns the daily «Hoy toca» e-mail on or off for the signed-in account. */
export async function setRemindersAction(on: boolean): Promise<ActionResult> {
  try {
    const { userId } = await requireUser();
    const { users } = await collections();
    await users.updateOne({ _id: userId }, { $set: { reminders: !!on } });
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export interface UnsubscribeState {
  done?: boolean;
  error?: string;
}

/** The «dejar de recibirlo» link in a reminder e-mail. It needs no sign-in: the signed token says whose it is. */
export async function unsubscribeAction(_prev: UnsubscribeState, formData: FormData): Promise<UnsubscribeState> {
  try {
    const userId = await verifyUnsubscribeToken(String(formData.get("token") ?? ""));
    if (!userId) return { error: "Este enlace no es válido o ya venció. Entra a Ajustes para apagar el recordatorio." };
    const { users } = await collections();
    await users.updateOne({ _id: userId }, { $set: { reminders: false } });
    return { done: true };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

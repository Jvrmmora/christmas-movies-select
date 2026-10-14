"use server";

import { refresh } from "next/cache";
import { collections } from "@/lib/db";
import type { ActionResult } from "@/lib/types";
import { errorMessage, requireOwner } from "./guard";

export async function saveDisplayNameAction(name: string): Promise<ActionResult> {
  try {
    const ownerId = await requireOwner();
    const displayName = String(name ?? "").trim().slice(0, 60);
    const { settings } = await collections();
    await settings.updateOne({ ownerId }, { $set: { displayName, updatedAt: new Date() } }, { upsert: true });
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

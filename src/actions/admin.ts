"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { clientIp } from "@/lib/client-ip";
import { collections } from "@/lib/db";
import { deleteHomeCascade } from "@/lib/homes";
import { RATE_RULES } from "@/lib/limits";
import { tooManyAttempts } from "@/lib/rate-limit";
import { limiter } from "@/lib/rate-limit-store";
import { createAdminSession, deleteAdminSession } from "@/lib/session";
import type { ActionResult } from "@/lib/types";
import { errorMessage, requireAdmin } from "./guard";

export interface AdminLoginState {
  error?: string;
}

function samePassword(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function adminLoginAction(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const expected = process.env.ADMIN_PASSWORD || process.env.APP_PASSWORD;
  if (!expected) return { error: "Falta ADMIN_PASSWORD (o APP_PASSWORD) en el servidor." };

  const key = `admin:${await clientIp()}`;
  const gate = await limiter.isBlocked(key, RATE_RULES.login);
  if (!gate.allowed) return { error: tooManyAttempts(gate.resetsAt) };

  if (!samePassword(String(formData.get("password") ?? ""), expected)) {
    await limiter.hit(key, RATE_RULES.login);
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Esa no es la clave de administración." };
  }
  await limiter.reset(key);
  await createAdminSession();
  redirect("/admin");
}

export async function adminLogoutAction() {
  await deleteAdminSession();
  redirect("/admin");
}

/** Removes a home and everything it owns. The caller must type the home's name to confirm. */
export async function deleteHomeAction(homeId: string, confirmName: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { homes } = await collections();
    const home = await homes.findOne({ _id: String(homeId) });
    if (!home) return { ok: false, error: "Esa casa ya no existe." };
    if (home.name.trim().toLowerCase() !== String(confirmName).trim().toLowerCase()) {
      return { ok: false, error: "Escribe el nombre de la casa tal como aparece para confirmar." };
    }
    await deleteHomeCascade(home._id);
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

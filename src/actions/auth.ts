"use server";

import { timingSafeEqual, createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/session";
import { DEFAULT_OWNER } from "@/lib/db";

export interface LoginState {
  error?: string;
}

function samePassword(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return { error: "La clave no está configurada en el servidor (APP_PASSWORD)." };
  const password = String(formData.get("password") ?? "");
  if (!samePassword(password, expected)) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Esa no es la clave. Intenta de nuevo." };
  }
  await createSession({ ownerId: DEFAULT_OWNER });
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}

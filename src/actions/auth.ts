"use server";

import { redirect } from "next/navigation";
import { clientIp } from "@/lib/client-ip";
import { collections } from "@/lib/db";
import { RATE_RULES } from "@/lib/limits";
import { hashSecret, verifySecret } from "@/lib/password";
import { tooManyAttempts } from "@/lib/rate-limit";
import { limiter } from "@/lib/rate-limit-store";
import { createSession, deleteSession } from "@/lib/session";
import { homeSlugSchema } from "@/lib/validation";

export interface LoginState {
  error?: string;
}

const WRONG = "Ese código de casa o esa clave no coinciden. Revisa e intenta de nuevo.";

// Verifying against this when the home doesn't exist keeps the response time the same, so the
// login form can't be used to find out which codes are taken.
let decoy: Promise<string> | undefined;

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const slug = homeSlugSchema.safeParse(formData.get("slug"));
  const password = String(formData.get("password") ?? "");
  const key = `login:${await clientIp()}:${slug.success ? slug.data : "-"}`;

  const gate = await limiter.isBlocked(key, RATE_RULES.login);
  if (!gate.allowed) return { error: tooManyAttempts(gate.resetsAt) };

  const { homes } = await collections();
  const home = slug.success ? await homes.findOne({ slug: slug.data }) : null;
  decoy ??= hashSecret("no-such-home");
  const ok = await verifySecret(password, home?.passwordHash ?? (await decoy));

  if (!home || !ok) {
    await limiter.hit(key, RATE_RULES.login);
    await new Promise((r) => setTimeout(r, 600));
    return { error: WRONG };
  }

  await limiter.reset(key);
  await homes.updateOne({ _id: home._id }, { $set: { lastActiveAt: new Date() } });
  await createSession({ homeId: home._id });
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}

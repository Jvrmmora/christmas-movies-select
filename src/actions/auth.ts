"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { clientIp } from "@/lib/client-ip";
import { collections } from "@/lib/db";
import { normalizeInviteCode } from "@/lib/invite-code";
import { homeCap, LIMITS, RATE_RULES } from "@/lib/limits";
import { hashSecret, verifySecret } from "@/lib/password";
import { tooManyAttempts } from "@/lib/rate-limit";
import { limiter } from "@/lib/rate-limit-store";
import { createProfileSession, createSession, deleteSession } from "@/lib/session";
import { accountInputSchema, emailSchema, firstIssue } from "@/lib/validation";

export interface LoginState {
  error?: string;
}

const WRONG = "Ese correo o esa clave no coinciden. Revisa e intenta de nuevo.";
const FULL = "Por ahora no hay lugar para más cuentas. Intenten más tarde.";

// Verifying against this when the account doesn't exist keeps the response time the same, so the
// login form can't be used to find out who is registered.
let decoy: Promise<string> | undefined;

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/** Where step 2 starts: with the invite code already filled in when the person came from a link. */
function welcomePath(code: FormDataEntryValue | null): string {
  const invite = normalizeInviteCode(typeof code === "string" ? code : "");
  return invite ? `/bienvenida?codigo=${invite}` : "/bienvenida";
}

/** Signs the account in and, when it already has its own profile in its home, picks that profile too. */
async function startSession(userId: string, homeId: string | null) {
  await createSession({ userId, homeId });
  if (!homeId) return;
  const { profiles, homes } = await collections();
  const own = await profiles.findOne({ homeId, userId }, { projection: { _id: 1 } });
  if (own) await createProfileSession({ homeId, profileId: own._id });
  await homes.updateOne({ _id: homeId }, { $set: { lastActiveAt: new Date() } });
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const key = `login:${await clientIp()}:${email.success ? email.data : "-"}`;

  const gate = await limiter.isBlocked(key, RATE_RULES.login);
  if (!gate.allowed) return { error: tooManyAttempts(gate.resetsAt) };

  const { users } = await collections();
  const user = email.success ? await users.findOne({ email: email.data }) : null;
  decoy ??= hashSecret("no-such-account");
  const ok = await verifySecret(password, user?.passwordHash ?? (await decoy));

  if (!user || !ok) {
    await limiter.hit(key, RATE_RULES.login);
    await new Promise((r) => setTimeout(r, 600));
    return { error: WRONG };
  }

  await limiter.reset(key);
  await users.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } });
  await startSession(user._id, user.homeId ?? null);
  redirect(user.homeId ? safeNext(formData.get("next")) : welcomePath(formData.get("codigo")));
}

/**
 * Step 1 of sign-up: e-mail + password, nothing else. Creating or joining a home comes next (/bienvenida).
 * Protected by a per-IP daily limit and a global cap tied to HOME_CAP.
 */
export async function signUpAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = accountInputSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const ipKey = `signup:${await clientIp()}`;
  const gate = await limiter.isBlocked(ipKey, RATE_RULES.signup);
  if (!gate.allowed) return { error: tooManyAttempts(gate.resetsAt) };

  const { users } = await collections();
  if ((await users.countDocuments()) >= homeCap() * LIMITS.profilesPerHome) return { error: FULL };

  const now = new Date();
  const userId = randomUUID();
  try {
    await users.insertOne({
      _id: userId,
      email: parsed.data.email,
      passwordHash: await hashSecret(parsed.data.password),
      homeId: null,
      createdAt: now,
      lastActiveAt: now,
    });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return { error: "Ese correo ya tiene cuenta. Entra con tu clave o recupérala." };
    }
    console.error(err);
    return { error: "No se pudo crear la cuenta. Intenta de nuevo." };
  }

  await limiter.hit(ipKey, RATE_RULES.signup);
  await createSession({ userId, homeId: null });
  redirect(welcomePath(formData.get("codigo")));
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}

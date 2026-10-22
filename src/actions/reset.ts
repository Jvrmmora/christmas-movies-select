"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { clientIp } from "@/lib/client-ip";
import { collections, type UserDoc } from "@/lib/db";
import { RATE_RULES } from "@/lib/limits";
import { canSendMail, sendResetCode } from "@/lib/mailer";
import { hashSecret, verifySecret } from "@/lib/password";
import { tooManyAttempts } from "@/lib/rate-limit";
import { limiter } from "@/lib/rate-limit-store";
import { generateResetCode, resetExpiry, RESET_MAX_ATTEMPTS } from "@/lib/reset-code";
import { createProfileSession, createSession } from "@/lib/session";
import { emailSchema, firstIssue, passwordSchema, resetCodeSchema } from "@/lib/validation";

export interface ResetState {
  error?: string;
  /** Set once the code was (maybe) sent: the form moves on to the code + new password step. */
  email?: string;
}

const BAD_CODE = "El código no es válido o ya venció. Pide uno nuevo.";

/** Creates, stores (hashed) and mails a code. Runs after the response so existing and unknown addresses answer in the same time. */
async function issueCode(user: Pick<UserDoc, "_id" | "email">) {
  try {
    const { users } = await collections();
    const code = generateResetCode();
    await users.updateOne({ _id: user._id }, { $set: { reset: { codeHash: await hashSecret(code), expiresAt: resetExpiry(), attempts: 0 } } });
    await sendResetCode(user.email, code);
  } catch (err) {
    console.error("No se pudo enviar el código de recuperación", err);
  }
}

/**
 * Step 1 of "forgot my password". The answer never says whether the address has an account,
 * so this form can't be used to find out who is registered.
 */
export async function requestResetAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: firstIssue(email.error) };
  if (!canSendMail()) return { error: "El envío de correos no está configurado. Avisa a quien administra la app." };

  const [byIp, byEmail] = await Promise.all([
    limiter.hit(`reset-ip:${await clientIp()}`, RATE_RULES.resetRequestIp),
    limiter.hit(`reset-mail:${email.data}`, RATE_RULES.resetRequestEmail),
  ]);
  const blocked = [byIp, byEmail].find((r) => !r.allowed);
  if (blocked) return { error: tooManyAttempts(blocked.resetsAt) };

  const { users } = await collections();
  const user = await users.findOne({ email: email.data }, { projection: { email: 1 } });
  if (user) after(() => issueCode(user));
  return { email: email.data };
}

/** Step 2: the six digits from the e-mail + the new password. */
export async function resetPasswordAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: firstIssue(email.error) };
  const code = resetCodeSchema.safeParse(String(formData.get("code") ?? ""));
  if (!code.success) return { email: email.data, error: firstIssue(code.error) };
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { email: email.data, error: firstIssue(password.error) };

  const key = `reset-verify:${await clientIp()}:${email.data}`;
  const gate = await limiter.isBlocked(key, RATE_RULES.resetVerify);
  if (!gate.allowed) return { email: email.data, error: tooManyAttempts(gate.resetsAt) };

  const { users, profiles } = await collections();
  // The attempt is counted before the comparison, so parallel guesses can't beat the limit.
  const user = await users.findOneAndUpdate(
    { email: email.data, "reset.expiresAt": { $gt: new Date() }, "reset.attempts": { $lt: RESET_MAX_ATTEMPTS } },
    { $inc: { "reset.attempts": 1 } },
    { returnDocument: "after" },
  );
  const ok = !!user?.reset && (await verifySecret(code.data, user.reset.codeHash));
  if (!user || !ok) {
    await limiter.hit(key, RATE_RULES.resetVerify);
    await new Promise((r) => setTimeout(r, 600));
    return { email: email.data, error: BAD_CODE };
  }

  await limiter.reset(key);
  await users.updateOne(
    { _id: user._id },
    { $set: { passwordHash: await hashSecret(password.data), lastActiveAt: new Date() }, $unset: { reset: "" } },
  );
  const homeId = user.homeId ?? null;
  await createSession({ userId: user._id, homeId });
  const own = homeId ? await profiles.findOne({ homeId, userId: user._id }, { projection: { _id: 1 } }) : null;
  if (homeId && own) await createProfileSession({ homeId, profileId: own._id });
  redirect(homeId ? "/" : "/bienvenida");
}

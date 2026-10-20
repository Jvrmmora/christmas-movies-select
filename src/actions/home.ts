"use server";

import { randomUUID } from "node:crypto";
import { clientIp } from "@/lib/client-ip";
import { collections } from "@/lib/db";
import { formatRecoveryCode, generateRecoveryCode, normalizeInviteCode, normalizeRecoveryCode } from "@/lib/invite";
import { homeCap, RATE_RULES } from "@/lib/limits";
import { hashSecret, verifySecret } from "@/lib/password";
import { tooManyAttempts } from "@/lib/rate-limit";
import { limiter } from "@/lib/rate-limit-store";
import { createSession } from "@/lib/session";
import { firstIssue, homeInputSchema, homePasswordSchema, homeSlugSchema } from "@/lib/validation";

/** The recovery code is returned once and only its hash is kept, so there is no way to show it again. */
export interface HomeFormState {
  error?: string;
  recoveryCode?: string;
}

const BAD_INVITE = "Ese código de invitación no es válido, ya se usó o venció.";

export async function createHomeAction(_prev: HomeFormState, formData: FormData): Promise<HomeFormState> {
  const parsed = homeInputSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;

  const ipKey = `invite:${await clientIp()}`;
  const gate = await limiter.isBlocked(ipKey, RATE_RULES.invite);
  if (!gate.allowed) return { error: tooManyAttempts(gate.resetsAt) };

  const code = normalizeInviteCode(String(formData.get("invite") ?? ""));
  if (!code) {
    await limiter.hit(ipKey, RATE_RULES.invite);
    return { error: BAD_INVITE };
  }

  const { homes, invites, profiles } = await collections();
  if ((await homes.countDocuments()) >= homeCap()) {
    return { error: "Por ahora no hay lugar para más casas. Escríbele a quien te invitó." };
  }
  if (await homes.findOne({ slug: input.slug }, { projection: { _id: 1 } })) {
    return { error: "Ese código de casa ya lo usa otra familia. Prueba con otro." };
  }

  // Single-use: the claim is one atomic update, so two people can't redeem the same code.
  const now = new Date();
  const homeId = randomUUID();
  const claimed = await invites.findOneAndUpdate(
    { _id: code, usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now, usedByHomeId: homeId } },
  );
  if (!claimed) {
    await limiter.hit(ipKey, RATE_RULES.invite);
    return { error: BAD_INVITE };
  }

  const release = () => invites.updateOne({ _id: code }, { $set: { usedAt: null, usedByHomeId: null } });
  const recovery = generateRecoveryCode();
  try {
    await homes.insertOne({
      _id: homeId,
      slug: input.slug,
      name: input.name,
      passwordHash: await hashSecret(input.password),
      recoveryHash: await hashSecret(recovery),
      inviteCode: code,
      createdAt: now,
      lastActiveAt: now,
    });
    // Concurrent sign-ups could slip past the earlier check; settle it after the fact.
    if ((await homes.countDocuments()) > homeCap()) {
      await homes.deleteOne({ _id: homeId });
      await release();
      return { error: "Por ahora no hay lugar para más casas. Escríbele a quien te invitó." };
    }
  } catch (err) {
    await homes.deleteOne({ _id: homeId });
    await profiles.deleteMany({ homeId });
    await release();
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return { error: "Ese código de casa ya lo usa otra familia. Prueba con otro." };
    }
    console.error(err);
    return { error: "No se pudo crear la casa. Intenta de nuevo." };
  }

  await createSession({ homeId });
  return { recoveryCode: formatRecoveryCode(recovery) };
}

export async function recoverAccessAction(_prev: HomeFormState, formData: FormData): Promise<HomeFormState> {
  const slug = homeSlugSchema.safeParse(formData.get("slug"));
  const password = homePasswordSchema.safeParse(formData.get("password"));
  if (!password.success) return { error: firstIssue(password.error) };
  const recoveryInput = normalizeRecoveryCode(String(formData.get("recovery") ?? ""));

  const key = `recovery:${await clientIp()}:${slug.success ? slug.data : "-"}`;
  const gate = await limiter.isBlocked(key, RATE_RULES.recovery);
  if (!gate.allowed) return { error: tooManyAttempts(gate.resetsAt) };

  const { homes } = await collections();
  const home = slug.success ? await homes.findOne({ slug: slug.data }) : null;
  const ok = !!home && !!recoveryInput && (await verifySecret(recoveryInput, home.recoveryHash));
  if (!home || !ok) {
    await limiter.hit(key, RATE_RULES.recovery);
    await new Promise((r) => setTimeout(r, 600));
    return { error: "El código de la casa o el código de recuperación no coinciden." };
  }

  // A recovery code is good for one reset; hand out a fresh one for next time.
  await limiter.reset(key);
  const next = generateRecoveryCode();
  await homes.updateOne(
    { _id: home._id },
    {
      $set: {
        passwordHash: await hashSecret(password.data),
        recoveryHash: await hashSecret(next),
        lastActiveAt: new Date(),
      },
    },
  );
  await createSession({ homeId: home._id });
  return { recoveryCode: formatRecoveryCode(next) };
}

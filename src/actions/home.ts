"use server";

import { randomUUID } from "node:crypto";
import { clientIp } from "@/lib/client-ip";
import { collections } from "@/lib/db";
import { formatRecoveryCode, generateRecoveryCode, normalizeRecoveryCode, randomSlugSuffix } from "@/lib/recovery-code";
import { homeCap, RATE_RULES } from "@/lib/limits";
import { hashSecret, verifySecret } from "@/lib/password";
import { tooManyAttempts } from "@/lib/rate-limit";
import { limiter } from "@/lib/rate-limit-store";
import { createSession } from "@/lib/session";
import { homeSlugFromName, slugCandidates } from "@/lib/slug";
import { firstIssue, homeInputSchema, homePasswordSchema, homeSlugSchema } from "@/lib/validation";

/** The recovery code is returned once and only its hash is kept, so there is no way to show it again. */
export interface HomeFormState {
  error?: string;
  recoveryCode?: string;
  /** The code the family will type to sign in (may differ from the suggestion if that one was taken). */
  slug?: string;
}

const FULL = "Por ahora no hay lugar para más casas. Intenten más tarde.";
const TAKEN = "Ese código de casa ya lo usa otra familia. Prueba con otro.";

const isDuplicate = (err: unknown) => !!err && typeof err === "object" && "code" in err && err.code === 11000;

/**
 * Open sign-up: name + password. The home code is suggested from the name; when the person kept the
 * suggestion and it is taken, the next free variant is used (casa-montano-2 …). Protected by a per-IP
 * daily limit and the global HOME_CAP.
 */
export async function createHomeAction(_prev: HomeFormState, formData: FormData): Promise<HomeFormState> {
  const name = String(formData.get("name") ?? "");
  const auto = formData.get("slugAuto") === "1";
  const parsed = homeInputSchema.safeParse({
    name,
    slug: auto ? homeSlugFromName(name) : formData.get("slug"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const input = parsed.data;

  const ipKey = `signup:${await clientIp()}`;
  const gate = await limiter.isBlocked(ipKey, RATE_RULES.signup);
  if (!gate.allowed) return { error: tooManyAttempts(gate.resetsAt) };

  const { homes, profiles } = await collections();
  if ((await homes.countDocuments()) >= homeCap()) return { error: FULL };

  const now = new Date();
  const homeId = randomUUID();
  const recovery = generateRecoveryCode();
  const [passwordHash, recoveryHash] = await Promise.all([hashSecret(input.password), hashSecret(recovery)]);
  const candidates = auto ? slugCandidates(input.slug, randomSlugSuffix) : [input.slug];

  let slug: string | null = null;
  try {
    for (const candidate of candidates) {
      try {
        await homes.insertOne({ _id: homeId, slug: candidate, name: input.name, passwordHash, recoveryHash, createdAt: now, lastActiveAt: now });
        slug = candidate;
        break;
      } catch (err) {
        // Unique index on slug: try the next variant (or report it when the person chose the code).
        if (!isDuplicate(err)) throw err;
      }
    }
    if (!slug) return { error: TAKEN };
    // Concurrent sign-ups could slip past the earlier check; settle it after the fact.
    if ((await homes.countDocuments()) > homeCap()) {
      await homes.deleteOne({ _id: homeId });
      return { error: FULL };
    }
  } catch (err) {
    await homes.deleteOne({ _id: homeId });
    await profiles.deleteMany({ homeId });
    console.error(err);
    return { error: "No se pudo crear la casa. Intenta de nuevo." };
  }

  await limiter.hit(ipKey, RATE_RULES.signup);
  await createSession({ homeId });
  return { recoveryCode: formatRecoveryCode(recovery), slug };
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

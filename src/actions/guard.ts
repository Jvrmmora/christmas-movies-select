import "server-only";
import { collections } from "@/lib/db";
import { readAdminSession, readProfileSession, readSession } from "@/lib/session";

export class UnauthorizedError extends Error {
  constructor(message = "Tu sesión terminó. Vuelve a entrar con el código de tu casa y la clave.") {
    super(message);
  }
}

/** Server Actions are reachable by POST, so each one re-checks the session. Returns the home id. */
export async function requireOwner(): Promise<string> {
  const session = await readSession();
  if (!session) throw new UnauthorizedError();
  // A deleted home keeps a valid cookie for up to 30 days; without this it could still write orphan data.
  const { homes } = await collections();
  if (!(await homes.countDocuments({ _id: session.homeId }, { limit: 1 }))) throw new UnauthorizedError();
  return session.homeId;
}

/**
 * Like requireOwner, but also proves who is acting: the profile cookie must belong to this very home
 * and the profile must still exist there (a deleted profile can't keep writing).
 */
export async function requireProfile(): Promise<{ ownerId: string; profileId: string }> {
  const ownerId = await requireOwner();
  const picked = await readProfileSession();
  if (!picked || picked.homeId !== ownerId) throw new UnauthorizedError("Elige quién eres en esta casa para continuar.");
  const { profiles } = await collections();
  const exists = await profiles.countDocuments({ _id: picked.profileId, homeId: ownerId }, { limit: 1 });
  if (!exists) throw new UnauthorizedError("Ese perfil ya no existe. Elige otro para continuar.");
  return { ownerId, profileId: picked.profileId };
}

export async function requireAdmin(): Promise<void> {
  if (!(await readAdminSession())) throw new UnauthorizedError("Entra al panel de administración para continuar.");
}

export function errorMessage(err: unknown, fallback = "Algo salió mal. Intenta de nuevo."): string {
  if (err instanceof Error && (err.name === "MetadataError" || err instanceof UnauthorizedError)) return err.message;
  if (err && typeof err === "object" && "code" in err && (err as { code: unknown }).code === 11000) {
    return "Esa película ya está en la lista (mismo título y año).";
  }
  console.error(err);
  return fallback;
}

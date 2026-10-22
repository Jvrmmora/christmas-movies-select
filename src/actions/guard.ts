import "server-only";
import { collections } from "@/lib/db";
import { readAdminSession, readProfileSession, readSession } from "@/lib/session";

export class UnauthorizedError extends Error {
  constructor(message = "Tu sesión terminó. Vuelve a entrar con tu correo y tu clave.") {
    super(message);
  }
}

/**
 * Server Actions are reachable by POST, so each one re-checks the session against the database:
 * a deleted account, or one whose home was deleted, can't keep writing with a cookie that is still valid.
 */
export async function requireUser(): Promise<{ userId: string; homeId: string | null }> {
  const session = await readSession();
  if (!session) throw new UnauthorizedError();
  const { users } = await collections();
  const user = await users.findOne({ _id: session.userId }, { projection: { homeId: 1 } });
  if (!user) throw new UnauthorizedError();
  return { userId: user._id, homeId: user.homeId ?? null };
}

/** The signed-in account's home id; everything the home owns is stored under it. */
export async function requireOwner(): Promise<string> {
  const { homeId } = await requireUser();
  if (!homeId) throw new UnauthorizedError("Primero crea una casa o únete a una.");
  return homeId;
}

/**
 * Like requireOwner, but also proves who is acting: the profile cookie must belong to this very home,
 * the profile must still exist there, and it must be loose or this account's own.
 */
export async function requireProfile(): Promise<{ ownerId: string; profileId: string }> {
  const { userId, homeId: ownerId } = await requireUser();
  if (!ownerId) throw new UnauthorizedError("Primero crea una casa o únete a una.");
  const picked = await readProfileSession();
  if (!picked || picked.homeId !== ownerId) throw new UnauthorizedError("Elige quién eres en esta casa para continuar.");
  const { profiles } = await collections();
  const profile = await profiles.findOne({ _id: picked.profileId, homeId: ownerId }, { projection: { userId: 1 } });
  if (!profile) throw new UnauthorizedError("Ese perfil ya no existe. Elige otro para continuar.");
  if (profile.userId && profile.userId !== userId) throw new UnauthorizedError("Ese perfil es de otra persona. Elige el tuyo.");
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

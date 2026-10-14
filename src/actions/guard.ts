import "server-only";
import { readSession } from "@/lib/session";

export class UnauthorizedError extends Error {
  constructor() {
    super("Tu sesión terminó. Vuelve a entrar con la clave.");
  }
}

/** Server Actions are reachable by POST, so each one re-checks the session. */
export async function requireOwner(): Promise<string> {
  const session = await readSession();
  if (!session) throw new UnauthorizedError();
  return session.ownerId;
}

export function errorMessage(err: unknown, fallback = "Algo salió mal. Intenta de nuevo."): string {
  if (err instanceof Error && (err.name === "MetadataError" || err instanceof UnauthorizedError)) return err.message;
  if (err && typeof err === "object" && "code" in err && (err as { code: unknown }).code === 11000) {
    return "Esa película ya está en la lista (mismo título y año).";
  }
  console.error(err);
  return fallback;
}

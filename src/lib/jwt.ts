import { SignJWT, jwtVerify } from "jose";

// Shared by proxy.ts and server code, so it must not import "server-only".

export const SESSION_COOKIE = "nv_session";
export const SESSION_DAYS = 30;

export interface SessionPayload {
  ownerId: string;
}

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET debe tener al menos 32 caracteres");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return typeof payload.ownerId === "string" ? { ownerId: payload.ownerId } : null;
  } catch {
    return null;
  }
}

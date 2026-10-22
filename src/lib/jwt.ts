import { SignJWT, jwtVerify } from "jose";

// Shared by proxy.ts and server code, so it must not import "server-only".

/** Which account signed in, and the home it belonged to then. */
export const SESSION_COOKIE = "nv_session";
export const SESSION_DAYS = 30;
/** Who is watching on this device, inside that home. */
export const PROFILE_COOKIE = "nv_profile";
export const PROFILE_DAYS = 365;
/** Access to /admin (homes). */
export const ADMIN_COOKIE = "nv_admin";
export const ADMIN_HOURS = 12;

export interface SessionPayload {
  userId: string;
  /** Null until the account creates or joins a home. A hint for routing: the database has the final word. */
  homeId: string | null;
}

export interface ProfilePayload {
  homeId: string;
  profileId: string;
}

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET debe tener al menos 32 caracteres");
  return new TextEncoder().encode(secret);
}

async function sign(claims: Record<string, string | boolean>, expiresIn: string): Promise<string> {
  return new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expiresIn).sign(key());
}

async function verify(token: string | undefined): Promise<Record<string, unknown> | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

export function signSession({ userId, homeId }: SessionPayload) {
  return sign(homeId ? { kind: "user", userId, homeId } : { kind: "user", userId }, `${SESSION_DAYS}d`);
}

/** Tokens from before personal accounts (kind "home") fail this check, so those sessions sign in again once. */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  const p = await verify(token);
  if (p?.kind !== "user" || typeof p.userId !== "string") return null;
  return { userId: p.userId, homeId: typeof p.homeId === "string" ? p.homeId : null };
}

export function signProfile(payload: ProfilePayload) {
  return sign({ kind: "profile", ...payload }, `${PROFILE_DAYS}d`);
}

export async function verifyProfileToken(token: string | undefined): Promise<ProfilePayload | null> {
  const p = await verify(token);
  return p?.kind === "profile" && typeof p.homeId === "string" && typeof p.profileId === "string"
    ? { homeId: p.homeId, profileId: p.profileId }
    : null;
}

export function signAdmin() {
  return sign({ kind: "admin", admin: true }, `${ADMIN_HOURS}h`);
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  const p = await verify(token);
  return p?.kind === "admin" && p.admin === true;
}

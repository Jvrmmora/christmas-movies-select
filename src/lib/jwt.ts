import { SignJWT, jwtVerify } from "jose";

// Shared by proxy.ts and server code, so it must not import "server-only".

/** Which home you signed in to. */
export const SESSION_COOKIE = "nv_session";
export const SESSION_DAYS = 30;
/** Who is watching on this device, inside that home. */
export const PROFILE_COOKIE = "nv_profile";
export const PROFILE_DAYS = 365;
/** Access to /admin (homes). */
export const ADMIN_COOKIE = "nv_admin";
export const ADMIN_HOURS = 12;

export interface SessionPayload {
  homeId: string;
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

export function signSession(payload: SessionPayload) {
  return sign({ kind: "home", ...payload }, `${SESSION_DAYS}d`);
}

/** Tokens from before multi-home (they carried ownerId) fail this check, so those sessions sign in again once. */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  const p = await verify(token);
  return p?.kind === "home" && typeof p.homeId === "string" ? { homeId: p.homeId } : null;
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

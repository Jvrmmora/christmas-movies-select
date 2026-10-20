import "server-only";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  ADMIN_HOURS,
  PROFILE_COOKIE,
  PROFILE_DAYS,
  SESSION_COOKIE,
  SESSION_DAYS,
  signAdmin,
  signProfile,
  signSession,
  verifyAdminToken,
  verifyProfileToken,
  verifySessionToken,
  type ProfilePayload,
  type SessionPayload,
} from "./jwt";

const DAY = 24 * 60 * 60;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function createSession(payload: SessionPayload) {
  const token = await signSession(payload);
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(SESSION_DAYS * DAY));
}

export async function readSession(): Promise<SessionPayload | null> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Signing out of the home also forgets who was watching on this device. */
export async function deleteSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(PROFILE_COOKIE);
}

export async function createProfileSession(payload: ProfilePayload) {
  const token = await signProfile(payload);
  (await cookies()).set(PROFILE_COOKIE, token, cookieOptions(PROFILE_DAYS * DAY));
}

export async function readProfileSession(): Promise<ProfilePayload | null> {
  return verifyProfileToken((await cookies()).get(PROFILE_COOKIE)?.value);
}

export async function deleteProfileSession() {
  (await cookies()).delete(PROFILE_COOKIE);
}

export async function createAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, await signAdmin(), cookieOptions(ADMIN_HOURS * 60 * 60));
}

export async function readAdminSession(): Promise<boolean> {
  return verifyAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

export async function deleteAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

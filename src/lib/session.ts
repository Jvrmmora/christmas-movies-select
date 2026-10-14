import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySessionToken, type SessionPayload } from "./jwt";

export async function createSession(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function deleteSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

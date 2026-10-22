import { randomInt } from "node:crypto";

/** How long an e-mailed code works, and how many wrong guesses it survives. */
export const RESET_TTL_MINUTES = 15;
export const RESET_MAX_ATTEMPTS = 5;

/** Six digits, the way banks send them: short enough to type from a phone notification. */
export function generateResetCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function resetExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + RESET_TTL_MINUTES * 60_000);
}

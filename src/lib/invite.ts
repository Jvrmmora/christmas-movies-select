import { randomInt } from "node:crypto";
import { LIMITS } from "./limits";

// 32 symbols, no 0/O/1/I: easy to read aloud or copy from a chat. 5 bits per symbol.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_PREFIX = "NAVI";
const INVITE_LENGTH = 8;
const RECOVERY_LENGTH = 16;

function randomCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

function group(code: string, size = 4): string {
  return code.match(new RegExp(`.{1,${size}}`, "g"))?.join("-") ?? code;
}

/** Ignores case, spaces and dashes, so "navi-7k2q-9xm4" and "7K2Q9XM4" are the same code. */
function normalize(input: string, length: number): string | null {
  let code = input.toUpperCase().replace(/[\s-]/g, "");
  if (length === INVITE_LENGTH && code.length === INVITE_LENGTH + INVITE_PREFIX.length && code.startsWith(INVITE_PREFIX)) {
    code = code.slice(INVITE_PREFIX.length);
  }
  if (code.length !== length) return null;
  return [...code].every((c) => ALPHABET.includes(c)) ? code : null;
}

/** Canonical form (what is stored): 8 symbols, no prefix or dashes. */
export function generateInviteCode(): string {
  return randomCode(INVITE_LENGTH);
}

/** Human form: NAVI-7K2Q-9XM4. */
export function formatInviteCode(code: string): string {
  return `${INVITE_PREFIX}-${group(code)}`;
}

/** Returns the canonical code, or null when the input can't be an invite. */
export function normalizeInviteCode(input: string): string | null {
  return normalize(input, INVITE_LENGTH);
}

export function inviteExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + LIMITS.inviteTtlDays * 24 * 60 * 60 * 1000);
}

/** 16 symbols (~80 bits), shown once when a home is created. */
export function generateRecoveryCode(): string {
  return randomCode(RECOVERY_LENGTH);
}

export function formatRecoveryCode(code: string): string {
  return group(code);
}

export function normalizeRecoveryCode(input: string): string | null {
  return normalize(input, RECOVERY_LENGTH);
}

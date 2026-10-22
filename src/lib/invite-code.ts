import { randomInt } from "node:crypto";

// 32 symbols, no 0/O/1/I: easy to read aloud or copy from a chat. 5 bits per symbol.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PREFIX = "NAVI";
const INVITE_LENGTH = 8;

function randomCode(length: number, alphabet = ALPHABET): string {
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}

/** "NAVI-7K2Q-9XM4": 8 random symbols (~40 bits), enough when wrong guesses are rate-limited. */
export function generateInviteCode(): string {
  const code = randomCode(INVITE_LENGTH);
  return `${PREFIX}-${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Ignores case, spaces, dashes and the NAVI prefix, so "navi 7k2q9xm4" and "7K2Q-9XM4" are the same code. */
export function normalizeInviteCode(input: string): string | null {
  let code = input.toUpperCase().replace(/[\s-]/g, "");
  if (code.length === PREFIX.length + INVITE_LENGTH && code.startsWith(PREFIX)) code = code.slice(PREFIX.length);
  if (code.length !== INVITE_LENGTH) return null;
  if (![...code].every((c) => ALPHABET.includes(c))) return null;
  return `${PREFIX}-${code.slice(0, 4)}-${code.slice(4)}`;
}

import { randomInt } from "node:crypto";

// 32 symbols, no 0/O/1/I: easy to read aloud or copy from a chat. 5 bits per symbol.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const RECOVERY_LENGTH = 16;

function randomCode(length: number, alphabet = ALPHABET): string {
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}

function group(code: string, size = 4): string {
  return code.match(new RegExp(`.{1,${size}}`, "g"))?.join("-") ?? code;
}

/** 16 symbols (~80 bits), shown once when a home is created. */
export function generateRecoveryCode(): string {
  return randomCode(RECOVERY_LENGTH);
}

export function formatRecoveryCode(code: string): string {
  return group(code);
}

/** Ignores case, spaces and dashes, so "7k2q-9xm4-…" and "7K2Q9XM4…" are the same code. */
export function normalizeRecoveryCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s-]/g, "");
  if (code.length !== RECOVERY_LENGTH) return null;
  return [...code].every((c) => ALPHABET.includes(c)) ? code : null;
}

/** Three lowercase letters/digits for a home code that is already taken ("casa-montano-k7q"). */
export function randomSlugSuffix(): string {
  return randomCode(3, "abcdefghjkmnpqrstuvwxyz23456789");
}

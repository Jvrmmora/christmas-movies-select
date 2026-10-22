import { describe, expect, it } from "vitest";
import { hashSecret, verifySecret } from "./password";
import { generateInviteCode, normalizeInviteCode } from "./invite-code";
import { DEFAULT_HOME_CAP, homeCap, inactiveCutoff, RATE_RULES } from "./limits";
import { CHARACTERS, starterAvatar, BACKGROUND_IDS } from "./avatar";
import { accountInputSchema, avatarSchema, emailSchema, homeNameSchema, profileInputSchema, resetCodeSchema } from "./validation";
import { generateResetCode, resetExpiry, RESET_TTL_MINUTES } from "./reset-code";

describe("password hashing", () => {
  it("accepts the right secret and rejects the wrong one", async () => {
    const stored = await hashSecret("nochebuena-2026");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(await verifySecret("nochebuena-2026", stored)).toBe(true);
    expect(await verifySecret("nochebuena-2025", stored)).toBe(false);
  });

  it("salts every hash and never stores the secret", async () => {
    const [a, b] = await Promise.all([hashSecret("misma-clave"), hashSecret("misma-clave")]);
    expect(a).not.toBe(b);
    expect(a).not.toContain("misma-clave");
  });

  it("rejects malformed stored values instead of throwing", async () => {
    expect(await verifySecret("x", "")).toBe(false);
    expect(await verifySecret("x", "plain-text")).toBe(false);
    expect(await verifySecret("x", "scrypt$zz$zz")).toBe(false);
  });
});

describe("invite codes", () => {
  it("look like NAVI-XXXX-XXXX with easy-to-read symbols", () => {
    for (let i = 0; i < 50; i++) expect(generateInviteCode()).toMatch(/^NAVI-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });

  it("accept any case, spaces, dashes and a missing prefix", () => {
    const code = generateInviteCode();
    expect(normalizeInviteCode(code.toLowerCase())).toBe(code);
    expect(normalizeInviteCode(code.replace(/-/g, " "))).toBe(code);
    expect(normalizeInviteCode(code.slice(5))).toBe(code);
  });

  it("reject codes that can't exist", () => {
    expect(normalizeInviteCode("")).toBeNull();
    expect(normalizeInviteCode("NAVI-7K2Q")).toBeNull(); // too short
    expect(normalizeInviteCode("NAVI-7K2Q-9XM0")).toBeNull(); // 0 is not in the alphabet
    expect(normalizeInviteCode("casa-montano")).toBeNull(); // the old home codes are gone
  });
});

describe("accounts", () => {
  it("lowercases and trims the e-mail, so the same address is always the same key", () => {
    expect(emailSchema.parse("  NamaDopi@Gmail.com ")).toBe("namadopi@gmail.com");
    expect(accountInputSchema.parse({ email: "Mora@x.com", password: "navidad" }).email).toBe("mora@x.com");
  });

  it("rejects things that are not an address", () => {
    for (const bad of ["", "sin-arroba", "a@", "@b.com", "a b@c.com"]) expect(emailSchema.safeParse(bad).success).toBe(false);
  });

  it("needs a password of at least 6 characters", () => {
    expect(accountInputSchema.safeParse({ email: "a@b.co", password: "12345" }).success).toBe(false);
    expect(accountInputSchema.safeParse({ email: "a@b.co" }).success).toBe(false);
  });

  it("home names are trimmed and required", () => {
    expect(homeNameSchema.parse(" Casa Monama ")).toBe("Casa Monama");
    expect(homeNameSchema.safeParse("  ").success).toBe(false);
    expect(homeNameSchema.safeParse("x".repeat(41)).success).toBe(false);
  });
});

describe("limits", () => {
  it("reads HOME_CAP and falls back to the default on bad input", () => {
    expect(homeCap(undefined)).toBe(DEFAULT_HOME_CAP);
    expect(homeCap("")).toBe(DEFAULT_HOME_CAP);
    expect(homeCap("40")).toBe(40);
    expect(homeCap("0")).toBe(0); // 0 closes sign-ups
    expect(homeCap("-3")).toBe(DEFAULT_HOME_CAP);
    expect(homeCap("mucho")).toBe(DEFAULT_HOME_CAP);
    expect(homeCap("2.5")).toBe(DEFAULT_HOME_CAP);
  });

  it("allows a few new accounts and homes per connection per day", () => {
    expect(DEFAULT_HOME_CAP).toBe(200);
    expect(RATE_RULES.signup).toEqual({ max: 3, windowMs: 24 * 60 * 60 * 1000 });
    expect(RATE_RULES.createHome).toEqual({ max: 3, windowMs: 24 * 60 * 60 * 1000 });
  });
});

describe("inactive homes", () => {
  it("cuts off a year before now", () => {
    const now = new Date("2027-03-01T00:00:00Z");
    expect(inactiveCutoff(now).toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });
});

describe("avatars", () => {
  it("builds valid, varied starter avatars", () => {
    const avatars = Array.from({ length: CHARACTERS.length }, (_, i) => starterAvatar(i));
    for (const a of avatars) expect(avatarSchema.safeParse(a).success).toBe(true);
    expect(new Set(avatars.map((a) => a.character)).size).toBe(CHARACTERS.length);
    expect(BACKGROUND_IDS).toContain(avatars[0].bg);
  });

  it("rejects unknown characters, colors and accessories", () => {
    const ok = { character: "rudolfo", bg: "berry", accessory: "gorro" };
    expect(avatarSchema.safeParse(ok).success).toBe(true);
    expect(avatarSchema.safeParse({ ...ok, character: "grinch" }).success).toBe(false);
    expect(avatarSchema.safeParse({ ...ok, bg: "#ff0000" }).success).toBe(false);
    expect(avatarSchema.safeParse({ ...ok, accessory: "<script>" }).success).toBe(false);
  });

  it("validates profile names", () => {
    const avatar = starterAvatar(0);
    expect(profileInputSchema.safeParse({ name: "  Ana ", avatar }).data?.name).toBe("Ana");
    expect(profileInputSchema.safeParse({ name: "", avatar }).success).toBe(false);
    expect(profileInputSchema.safeParse({ name: "x".repeat(17), avatar }).success).toBe(false);
  });
});

describe("password reset codes", () => {
  it("are six digits, zero-padded", () => {
    for (let i = 0; i < 50; i++) expect(generateResetCode()).toMatch(/^\d{6}$/);
  });

  it("accept spaces and dashes when typed", () => {
    expect(resetCodeSchema.parse("123 456")).toBe("123456");
    expect(resetCodeSchema.parse("123-456")).toBe("123456");
    expect(resetCodeSchema.safeParse("12345").success).toBe(false);
    expect(resetCodeSchema.safeParse("12345a").success).toBe(false);
  });

  it("expire after the advertised minutes", () => {
    const now = new Date("2026-12-01T10:00:00Z");
    expect(resetExpiry(now).getTime() - now.getTime()).toBe(RESET_TTL_MINUTES * 60_000);
  });
});

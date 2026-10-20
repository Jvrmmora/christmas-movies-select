import { describe, expect, it } from "vitest";
import { hashSecret, verifySecret } from "./password";
import {
  formatInviteCode,
  formatRecoveryCode,
  generateInviteCode,
  generateRecoveryCode,
  inviteExpiry,
  normalizeInviteCode,
  normalizeRecoveryCode,
} from "./invite";
import { DEFAULT_HOME_CAP, homeCap, inactiveCutoff, LIMITS } from "./limits";
import { splitDisplayName } from "./display-name";
import { slugify } from "./slug";
import { CHARACTERS, starterAvatar, BACKGROUND_IDS } from "./avatar";
import { avatarSchema, homeInputSchema, homeSlugSchema, profileInputSchema } from "./validation";

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

describe("invite and recovery codes", () => {
  it("generates 8-symbol invites without look-alike characters", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateInviteCode();
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    }
  });

  it("formats as NAVI-XXXX-XXXX and normalizes every way people type it", () => {
    const code = "7K2Q9XM4";
    expect(formatInviteCode(code)).toBe("NAVI-7K2Q-9XM4");
    for (const typed of ["NAVI-7K2Q-9XM4", "navi-7k2q-9xm4", " 7k2q 9xm4 ", "7K2Q9XM4", "navi7k2q9xm4"]) {
      expect(normalizeInviteCode(typed)).toBe(code);
    }
  });

  it("rejects codes that can't exist", () => {
    expect(normalizeInviteCode("")).toBeNull();
    expect(normalizeInviteCode("7K2Q9XM")).toBeNull(); // too short
    expect(normalizeInviteCode("7K2Q9XM45")).toBeNull(); // too long
    expect(normalizeInviteCode("7K2Q9XM0")).toBeNull(); // 0 is not in the alphabet
    expect(normalizeInviteCode("7K2Q9XMO")).toBeNull(); // O is not in the alphabet
  });

  it("expires invites after the configured days", () => {
    const from = new Date("2026-11-01T00:00:00Z");
    const days = (inviteExpiry(from).getTime() - from.getTime()) / 86_400_000;
    expect(days).toBe(LIMITS.inviteTtlDays);
  });

  it("round-trips 16-symbol recovery codes", () => {
    const code = generateRecoveryCode();
    expect(code).toHaveLength(16);
    expect(formatRecoveryCode(code)).toMatch(/^(\w{4}-){3}\w{4}$/);
    expect(normalizeRecoveryCode(formatRecoveryCode(code).toLowerCase())).toBe(code);
    expect(normalizeInviteCode(code)).toBeNull();
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
});

describe("inactive homes", () => {
  it("cuts off a year before now", () => {
    const now = new Date("2027-03-01T00:00:00Z");
    expect(inactiveCutoff(now).toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });
});

describe("display name → profiles", () => {
  it("splits the old greeting into one name per person", () => {
    expect(splitDisplayName("Ana y Leo")).toEqual(["Ana", "Leo"]);
    expect(splitDisplayName("Ana, Leo & Sofi")).toEqual(["Ana", "Leo", "Sofi"]);
    expect(splitDisplayName("Javier")).toEqual(["Javier"]);
    expect(splitDisplayName("Yolanda")).toEqual(["Yolanda"]); // "y" inside a word is not a separator
    expect(splitDisplayName("   ")).toEqual([]);
    expect(splitDisplayName("Ana, Ana")).toEqual(["Ana"]);
  });
});

describe("slugify", () => {
  it("turns a home name into a valid code", () => {
    expect(slugify("Casa Montaño")).toBe("casa-montano");
    expect(slugify("  Los   Pérez & Co. 🎄 ")).toBe("los-perez-co");
    expect(slugify("---")).toBe("");
    expect(homeSlugSchema.safeParse(slugify("La familia Gómez-Rodríguez de la Montaña")).success).toBe(true);
    expect(slugify("La familia Gómez-Rodríguez de la Montaña").length).toBeLessThanOrEqual(24);
    expect(slugify("a".repeat(23) + " b")).toBe("a".repeat(23)); // never ends on a dash after trimming
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

describe("home input", () => {
  it("normalizes slugs and enforces the allowed shape", () => {
    expect(homeSlugSchema.safeParse("  Casa-Montano ").data).toBe("casa-montano");
    expect(homeSlugSchema.safeParse("abc").success).toBe(true);
    expect(homeSlugSchema.safeParse("ab").success).toBe(false);
    expect(homeSlugSchema.safeParse("a".repeat(25)).success).toBe(false);
    expect(homeSlugSchema.safeParse("-casa").success).toBe(false);
    expect(homeSlugSchema.safeParse("casa-").success).toBe(false);
    expect(homeSlugSchema.safeParse("mi casa").success).toBe(false);
    expect(homeSlugSchema.safeParse("casa_x").success).toBe(false);
    expect(homeSlugSchema.safeParse("niño").success).toBe(false);
  });

  it("requires a name and a password of at least 6 characters", () => {
    const ok = { name: "Casa Montaño", slug: "casa-montano", password: "navidad" };
    expect(homeInputSchema.safeParse(ok).success).toBe(true);
    expect(homeInputSchema.safeParse({ ...ok, password: "12345" }).success).toBe(false);
    expect(homeInputSchema.safeParse({ ...ok, name: "  " }).success).toBe(false);
  });
});

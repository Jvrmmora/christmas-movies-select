import { describe, expect, it } from "vitest";
import { createLimiter, createMemoryStore, tooManyAttempts } from "./rate-limit";
import { RATE_RULES } from "./limits";

function setup() {
  let now = Date.parse("2026-12-01T10:00:00Z");
  const limiter = createLimiter(createMemoryStore(() => now));
  return { limiter, advance: (ms: number) => (now += ms), now: () => new Date(now) };
}

describe("rate limiter", () => {
  const rule = { max: 3, windowMs: 60_000 };

  it("allows up to max events in a window, then blocks", async () => {
    const { limiter } = setup();
    const results = [];
    for (let i = 0; i < 5; i++) results.push((await limiter.hit("k", rule)).allowed);
    expect(results).toEqual([true, true, true, false, false]);
  });

  it("reports the remaining budget", async () => {
    const { limiter } = setup();
    expect((await limiter.hit("k", rule)).remaining).toBe(2);
    expect((await limiter.hit("k", rule)).remaining).toBe(1);
  });

  it("opens a fresh window after it expires", async () => {
    const { limiter, advance } = setup();
    for (let i = 0; i < 4; i++) await limiter.hit("k", rule);
    expect((await limiter.hit("k", rule)).allowed).toBe(false);
    advance(rule.windowMs + 1);
    expect((await limiter.hit("k", rule)).allowed).toBe(true);
  });

  it("keeps keys independent", async () => {
    const { limiter } = setup();
    for (let i = 0; i < 4; i++) await limiter.hit("ip-1|casa", rule);
    expect((await limiter.hit("ip-2|casa", rule)).allowed).toBe(true);
    expect((await limiter.hit("ip-1|otra", rule)).allowed).toBe(true);
  });

  it("isBlocked peeks without consuming budget", async () => {
    const { limiter } = setup();
    for (let i = 0; i < 10; i++) expect((await limiter.isBlocked("k", rule)).allowed).toBe(true);
    for (let i = 0; i < 3; i++) await limiter.hit("k", rule);
    expect((await limiter.isBlocked("k", rule)).allowed).toBe(false);
  });

  it("reset clears the window (a correct password forgives earlier typos)", async () => {
    const { limiter } = setup();
    for (let i = 0; i < 3; i++) await limiter.hit("k", rule);
    await limiter.reset("k");
    expect((await limiter.isBlocked("k", rule)).allowed).toBe(true);
  });

  it("locks the login after 5 wrong passwords for 15 minutes", async () => {
    const { limiter, advance } = setup();
    for (let i = 0; i < RATE_RULES.login.max; i++) await limiter.hit("login", RATE_RULES.login);
    expect((await limiter.isBlocked("login", RATE_RULES.login)).allowed).toBe(false);
    advance(RATE_RULES.login.windowMs + 1);
    expect((await limiter.isBlocked("login", RATE_RULES.login)).allowed).toBe(true);
  });
});

describe("tooManyAttempts", () => {
  it("tells how many minutes are left, rounding up", () => {
    const now = new Date("2026-12-01T10:00:00Z");
    expect(tooManyAttempts(new Date("2026-12-01T10:12:10Z"), now)).toBe("Demasiados intentos. Prueba de nuevo en 13 minutos.");
    expect(tooManyAttempts(new Date("2026-12-01T10:00:20Z"), now)).toBe("Demasiados intentos. Prueba de nuevo en 1 minuto.");
  });
});

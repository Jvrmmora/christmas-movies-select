import { afterEach, describe, expect, it, vi } from "vitest";
import { signUnsubscribe, verifyUnsubscribeToken, signSession } from "./jwt";
import { movieSummary, reminderDateKey, safeImageUrl, safeWebUrl } from "./reminders";

describe("reminder helpers", () => {
  it("dates a run by its UTC day", () => {
    expect(reminderDateKey(new Date("2026-12-01T13:05:00Z"))).toBe("2026-12-01");
    // Late evening in Bogotá is already the next day in UTC: the run is about the UTC day.
    expect(reminderDateKey(new Date("2026-12-01T23:30:00-05:00"))).toBe("2026-12-02");
    expect(reminderDateKey(new Date("2026-03-09T00:00:00Z"))).toBe("2026-03-09");
  });

  it("summarizes a movie in one line", () => {
    expect(movieSummary({ year: 2019, runtimeMinutes: 98, genres: ["Comedia", "Familia", "Fantasía"] })).toBe("2019 · 1 h 38 min · Comedia, Familia");
    expect(movieSummary({ year: 1990, runtimeMinutes: null, genres: [] })).toBe("1990");
    expect(movieSummary({ year: 0, runtimeMinutes: 120 })).toBe("2 h");
  });

  it("lets only https images through", () => {
    expect(safeImageUrl("https://images.justwatch.com/poster/1/s718/poster.webp")).toBe("https://images.justwatch.com/poster/1/s718/poster.webp");
    expect(safeImageUrl("http://images.example.com/p.jpg")).toBeNull();
    expect(safeImageUrl("data:image/png;base64,AAAA")).toBeNull();
    expect(safeImageUrl("")).toBeNull();
    expect(safeImageUrl(null)).toBeNull();
  });

  it("lets only web links through", () => {
    expect(safeWebUrl("https://www.netflix.com/title/1")).toBe("https://www.netflix.com/title/1");
    expect(safeWebUrl("http://example.com")).toBe("http://example.com");
    expect(safeWebUrl("javascript:alert(1)")).toBeNull();
    expect(safeWebUrl("")).toBeNull();
    expect(safeWebUrl(undefined)).toBeNull();
  });
});

describe("unsubscribe token", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("round-trips the account it was made for", async () => {
    vi.stubEnv("AUTH_SECRET", "x".repeat(40));
    expect(await verifyUnsubscribeToken(await signUnsubscribe("user-1"))).toBe("user-1");
  });

  it("rejects a missing, garbled or foreign token", async () => {
    vi.stubEnv("AUTH_SECRET", "x".repeat(40));
    expect(await verifyUnsubscribeToken(undefined)).toBeNull();
    expect(await verifyUnsubscribeToken("no-es-un-token")).toBeNull();
    // A sign-in session must never work as an unsubscribe link, and the other way round.
    expect(await verifyUnsubscribeToken(await signSession({ userId: "user-1", homeId: null }))).toBeNull();
  });

  it("doesn't verify with another secret", async () => {
    vi.stubEnv("AUTH_SECRET", "a".repeat(40));
    const token = await signUnsubscribe("user-1");
    vi.stubEnv("AUTH_SECRET", "b".repeat(40));
    expect(await verifyUnsubscribeToken(token)).toBeNull();
  });
});

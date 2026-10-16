import { describe, expect, it } from "vitest";
import { countdownTo, GREETING, periodFor } from "./greeting";
import { formatRuntime, formatScore, rtVerdict } from "./format";
import { parseLines } from "./parse-list";
import { filterKey, primaryOffer } from "./platforms";
import type { StreamingOffer } from "./types";

describe("greeting", () => {
  it("says good morning, afternoon and night at the right hours", () => {
    expect(GREETING[periodFor(5)]).toBe("Buenos días");
    expect(GREETING[periodFor(11)]).toBe("Buenos días");
    expect(GREETING[periodFor(12)]).toBe("Buenas tardes");
    expect(GREETING[periodFor(18)]).toBe("Buenas tardes");
    expect(GREETING[periodFor(19)]).toBe("Buenas noches");
    expect(GREETING[periodFor(2)]).toBe("Buenas noches");
  });

  it("counts down to the stroke of midnight that starts Christmas Day", () => {
    const cd = countdownTo(new Date(2026, 9, 11, 12, 0, 0));
    // Oct 11 12:00 → Dec 25 00:00 = 74 days and 12 hours.
    expect([cd.days, cd.hours, cd.minutes, cd.seconds]).toEqual([74, 12, 0, 0]);
    expect(cd.isChristmas).toBe(false);
    // Christmas Eve evening: hours left, not zero days of "Nochebuena".
    const eve = countdownTo(new Date(2026, 11, 24, 21, 30, 15));
    expect([eve.days, eve.hours, eve.minutes, eve.seconds]).toEqual([0, 2, 29, 45]);
  });

  it("celebrates on Dec 25 and starts the next year on Dec 26", () => {
    expect(countdownTo(new Date(2026, 11, 25, 9)).isChristmas).toBe(true);
    expect(countdownTo(new Date(2026, 11, 25, 9)).days).toBe(0);
    const next = countdownTo(new Date(2026, 11, 26));
    expect(next.isChristmas).toBe(false);
    expect(next.days).toBe(364);
  });
});

describe("format", () => {
  it("formats runtimes and scores the Colombian way", () => {
    expect(formatRuntime(103)).toBe("1 h 43 min");
    expect(formatRuntime(120)).toBe("2 h");
    expect(formatRuntime(45)).toBe("45 min");
    expect(formatScore(7.8)).toBe("7,8");
    expect(formatScore(null)).toBe("—");
  });

  it("picks the Rotten Tomatoes icon from the score", () => {
    expect(rtVerdict(95, true)).toBe("certified");
    expect(rtVerdict(66, false)).toBe("fresh");
    expect(rtVerdict(60, false)).toBe("fresh");
    expect(rtVerdict(59, true)).toBe("rotten");
    expect(rtVerdict(null, false)).toBeNull();
  });
});

describe("parseLines", () => {
  it("reads the formats people paste", () => {
    expect(parseLines("Klaus (2019)\nHome Alone 1990\n- Elf - 2003\n1. Noelle\n\n")).toEqual([
      { query: "Klaus", year: 2019 },
      { query: "Home Alone", year: 1990 },
      { query: "Elf", year: 2003 },
      { query: "Noelle" },
    ]);
    expect(parseLines("Iron Man 3 (2013)")).toEqual([{ query: "Iron Man 3", year: 2013 }]);
  });
});

describe("platforms", () => {
  const offer = (p: Partial<StreamingOffer>): StreamingOffer => ({ provider: "x", name: "X", type: "flatrate", url: "https://x", ...p });

  it("prefers subscription offers for the main button", () => {
    const main = primaryOffer([offer({ provider: "itunes", name: "Apple TV", type: "rent" }), offer({ provider: "netflix", name: "Netflix" })]);
    expect(main?.provider).toBe("netflix");
    expect(primaryOffer([offer({ type: "buy", provider: "amazon" })])?.provider).toBe("amazon");
    expect(primaryOffer([])).toBeNull();
  });

  it("groups Prime Video channels under their parent service", () => {
    expect(filterKey(offer({ provider: "amazonhbomax", name: "HBO Max (Prime Video)" })).key).toBe("max");
    expect(filterKey(offer({ provider: "amazonsonyone", name: "Sony One (Prime Video)" })).key).toBe("amazonsonyone");
  });
});

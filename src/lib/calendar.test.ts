import { describe, expect, it } from "vitest";
import { daysUntil, freeDays, monthCells, normalizePreset, parseKey, planAutoFill, PRESETS, presetStart, rangeDays, seasonFor, toKey } from "./calendar";

describe("daysUntil", () => {
  it("counts whole calendar days", () => {
    expect(daysUntil("2026-10-23", "2026-12-01")).toBe(39);
    expect(daysUntil("2026-12-01", "2026-12-01")).toBe(0);
    expect(daysUntil("2026-12-02", "2026-12-01")).toBe(-1);
  });

  it("isn't thrown off by the clocks changing", () => {
    // Daylight saving starts on 2026-03-08 in the US, so that day is 23 hours long there.
    expect(daysUntil("2026-03-07", "2026-03-09")).toBe(2);
    expect(daysUntil("2026-10-31", "2026-11-02")).toBe(2);
  });
});

describe("calendar ranges", () => {
  const today = new Date(2026, 9, 11);

  it("resolves every preset to a start date before Christmas Eve", () => {
    expect(presetStart("today", 2026, today)).toBe("2026-10-11");
    expect(presetStart("nov", 2026, today)).toBe("2026-11-01");
    expect(presetStart("dec", 2026, today)).toBe("2026-12-01");
    expect(presetStart("custom", 2026, today, "2026-11-22")).toBe("2026-11-22");
    expect(presetStart("custom", 2026, today, "2026-12-30")).toBe("2026-12-24");
  });

  it("offers only Desde hoy, Nov, Dic and Personalizado", () => {
    expect(PRESETS.map((p) => p.key)).toEqual(["today", "nov", "dec", "custom"]);
  });

  it("reads retired presets as a custom range", () => {
    expect(normalizePreset("oct")).toBe("custom");
    expect(normalizePreset("novena")).toBe("custom");
    expect(normalizePreset(undefined)).toBe("custom");
    expect(normalizePreset("nov")).toBe("nov");
  });

  it("counts the days in each range", () => {
    expect(rangeDays("2026-12-01", "2026-12-24")).toHaveLength(24);
    expect(rangeDays("2026-12-16", "2026-12-24")).toHaveLength(9);
    expect(rangeDays("2026-10-01", "2026-12-24")).toHaveLength(85);
    // 33 movies fit exactly from Nov 22.
    expect(rangeDays("2026-11-22", "2026-12-24")).toHaveLength(33);
  });

  it("round-trips date keys in local time", () => {
    expect(toKey(parseKey("2026-03-08"))).toBe("2026-03-08");
  });

  it("rolls the season over after Christmas Eve", () => {
    expect(seasonFor(new Date(2026, 11, 24, 20))).toBe(2026);
    expect(seasonFor(new Date(2026, 11, 26))).toBe(2027);
  });

  it("lays out a Sunday-first month with Christmas and no days after it", () => {
    const days = rangeDays("2026-12-01", "2026-12-24");
    const cells = monthCells("2026-12", new Map(days.map((k, i) => [k, i + 1])));
    // Dec 1, 2026 is a Tuesday → two blank cells (Sun, Mon).
    expect(cells.slice(0, 2).map((c) => c.kind)).toEqual(["blank", "blank"]);
    expect(cells[2]).toMatchObject({ kind: "door", day: 1, index: 1 });
    expect(cells.filter((c) => c.kind === "door")).toHaveLength(24);
    expect(cells.at(-1)?.kind).toBe("xmas");
  });

  it("marks days outside the range", () => {
    const days = rangeDays("2026-10-11", "2026-12-24");
    const cells = monthCells("2026-10", new Map(days.map((k, i) => [k, i + 1])));
    const out = cells.filter((c) => c.kind === "out");
    expect(out).toHaveLength(10);
  });

  it("finds free days from today on", () => {
    const days = rangeDays("2026-12-20", "2026-12-24");
    expect(freeDays(days, { "2026-12-21": "a" }, "2026-12-21")).toEqual(["2026-12-22", "2026-12-23", "2026-12-24"]);
  });
});

describe("planAutoFill", () => {
  const days = rangeDays("2026-11-01", "2026-11-10");

  it("places every movie, from the first free day on", () => {
    const { next, placed, left } = planAutoFill(days, { "2026-11-02": "x" }, ["a", "b", "c"], "2026-11-01");
    expect(next).toEqual({ "2026-11-01": "a", "2026-11-02": "x", "2026-11-03": "b", "2026-11-04": "c" });
    expect([placed, left]).toEqual([3, 0]);
  });

  it("moves a movie that was assigned outside the range instead of duplicating it", () => {
    // Switching from "Desde hoy" (Oct) to "1 nov" leaves movie "a" on an Oct day.
    const { next } = planAutoFill(days, { "2026-10-20": "a", "2026-11-01": "x" }, ["a", "b"], "2026-11-01");
    expect(Object.values(next).filter((id) => id === "a")).toHaveLength(1);
    expect(next["2026-10-20"]).toBeUndefined();
    expect(next["2026-11-02"]).toBe("a");
  });

  it("uses earlier free days only when the later ones run out", () => {
    const { next, placed, left } = planAutoFill(days, {}, ["a", "b", "c"], "2026-11-09");
    expect(next["2026-11-09"]).toBe("a");
    expect(next["2026-11-10"]).toBe("b");
    expect(next["2026-11-01"]).toBe("c");
    expect([placed, left]).toEqual([3, 0]);
  });

  it("reports the movies that do not fit", () => {
    const { placed, left } = planAutoFill(rangeDays("2026-12-22", "2026-12-24"), {}, ["a", "b", "c", "d", "e"], "2026-12-22");
    expect([placed, left]).toEqual([3, 2]);
  });
});

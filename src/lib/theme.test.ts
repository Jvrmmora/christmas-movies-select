import { describe, expect, it } from "vitest";
import { isNight, parseMode, resolveDark } from "./theme";

const at = (h: number, m = 0) => new Date(2026, 11, 1, h, m);

describe("theme", () => {
  it("is night from 18:00 to 05:59", () => {
    expect(isNight(17)).toBe(false);
    expect(isNight(18)).toBe(true);
    expect(isNight(23)).toBe(true);
    expect(isNight(0)).toBe(true);
    expect(isNight(5)).toBe(true);
    expect(isNight(6)).toBe(false);
    expect(isNight(12)).toBe(false);
  });

  it("treats unknown stored values as automatic", () => {
    expect(parseMode(null)).toBe("auto");
    expect(parseMode("auto")).toBe("auto");
    expect(parseMode("sepia")).toBe("auto");
    expect(parseMode("light")).toBe("light");
    expect(parseMode("dark")).toBe("dark");
  });

  it("follows the clock only in automatic mode", () => {
    expect(resolveDark("auto", at(20))).toBe(true);
    expect(resolveDark("auto", at(9, 30))).toBe(false);
    expect(resolveDark("light", at(23))).toBe(false);
    expect(resolveDark("dark", at(12))).toBe(true);
  });
});

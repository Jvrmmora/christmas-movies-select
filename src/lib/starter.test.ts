import { describe, expect, it } from "vitest";
import { shouldOfferStarter } from "./starter";

describe("shouldOfferStarter", () => {
  it("offers the classics to an empty home that hasn't seen them", () => {
    expect(shouldOfferStarter(0, false)).toBe(true);
  });

  it("doesn't offer them again once they were shown, even if the home is still empty", () => {
    expect(shouldOfferStarter(0, true)).toBe(false);
  });

  it("never offers them to a home that already has movies", () => {
    expect(shouldOfferStarter(1, false)).toBe(false);
    expect(shouldOfferStarter(35, true)).toBe(false);
  });
});

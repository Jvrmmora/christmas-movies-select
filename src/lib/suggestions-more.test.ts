import { describe, expect, it } from "vitest";
import { isGoodEnough, isRelevant } from "./suggestions-more";

describe("suggestion filters", () => {
  it("keeps movies that are clearly about Christmas", () => {
    expect(isRelevant({ title: "Una Navidad De Locos", originalTitle: "Christmas with the Kranks", synopsis: "" })).toBe(true);
    expect(isRelevant({ title: "Un cuento", originalTitle: "A Tale", synopsis: "Santa Claus llega a la ciudad" })).toBe(true);
    expect(isRelevant({ title: "El Grinch", originalTitle: "The Grinch", synopsis: "" })).toBe(true);
  });

  it("drops movies that only matched the search by accident", () => {
    expect(isRelevant({ title: "Tenet", originalTitle: "Tenet", synopsis: "Un agente secreto viaja en el tiempo." })).toBe(false);
  });

  it("needs a decent public or critics score", () => {
    const ratings = (imdb: number | null, rt: number | null) => ({ ratings: { imdb, rottenTomatoes: rt, certifiedFresh: false } });
    expect(isGoodEnough(ratings(5.5, null))).toBe(true);
    expect(isGoodEnough(ratings(4.9, 60))).toBe(true);
    expect(isGoodEnough(ratings(4.9, 40))).toBe(false);
    expect(isGoodEnough(ratings(null, null))).toBe(false);
  });
});

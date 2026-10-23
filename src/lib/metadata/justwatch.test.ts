import { describe, expect, it } from "vitest";
import { cleanProviderName, mapOffers, scoreMatch, toCandidate } from "./justwatch";

// Trimmed real response for "Home Alone" (country CO, language es-CO).
const homeAlone = {
  id: "tm192233",
  objectType: "MOVIE",
  content: {
    title: "Mi pobre angelito",
    originalTitle: "Home Alone",
    originalReleaseYear: 1990,
    runtime: 103,
    shortDescription: "Kevin McAllister es un niño de ocho años…",
    posterUrl: "/poster/101468484/{profile}/solo-en-casa.{format}",
    backdrops: [{ backdropUrl: "/backdrop/1/{profile}/.{format}" }],
    genres: [{ shortName: "cmy" }, { shortName: "fml" }, { shortName: "xyz" }],
    scoring: { imdbScore: 7.8, imdbVotes: 700000, tomatoMeter: 66, certifiedFresh: null },
    externalIds: { imdbId: "tt0099785", tmdbId: "771" },
    clips: [],
  },
  offers: [
    { monetizationType: "FLATRATE", standardWebURL: "https://www.disneyplus.com/browse/entity-1", package: { clearName: "Disney Plus", technicalName: "disneyplus", icon: "/icon/313118777/{profile}/disneyplus.{format}" } },
    { monetizationType: "FLATRATE", standardWebURL: "https://www.disneyplus.com/browse/entity-1", package: { clearName: "Disney Plus", technicalName: "disneyplus", icon: "/icon/313118777/{profile}/disneyplus.{format}" } },
    { monetizationType: "RENT", standardWebURL: "https://tv.apple.com/co/movie/x", package: { clearName: "Apple TV Store", technicalName: "itunes", icon: null } },
    { monetizationType: "FLATRATE", standardWebURL: "https://www.movistarplay.co/details/movie/19586991", package: { clearName: "MovistarTV", technicalName: "movistarplay", icon: "/icon/310445571/{profile}/movistarplay.{format}" } },
    { monetizationType: "CINEMA", standardWebURL: "https://cine.example", package: { clearName: "Cine", technicalName: "cine", icon: null } },
  ],
};

describe("JustWatch mapping", () => {
  it("dedupes offers, drops unsupported types and orders subscriptions first", () => {
    const offers = mapOffers(homeAlone.offers);
    expect(offers.map((o) => `${o.name}:${o.type}`)).toEqual(["Disney+:flatrate", "Movistar TV:flatrate", "Apple TV:rent"]);
    expect(offers[0].logoUrl).toBe("https://images.justwatch.com/icon/313118777/s100/disneyplus.webp");
  });

  it("builds a full candidate in Spanish", () => {
    const c = toCandidate(homeAlone, "Home Alone", 1990);
    expect(c.title).toBe("Mi pobre angelito");
    expect(c.genres).toEqual(["Comedia", "Familia"]);
    expect(c.posterUrl).toBe("https://images.justwatch.com/poster/101468484/s718/solo-en-casa.webp");
    expect(c.backdropUrl).toBe("https://images.justwatch.com/backdrop/1/s1440/poster.webp");
    expect(c.ratings).toMatchObject({ imdb: 7.8, rottenTomatoes: 66, certifiedFresh: false });
    expect(c.trailerUrl).toContain("youtube.com/results");
    expect(c.score).toBeGreaterThanOrEqual(1);
  });

  it("scores title and year matches", () => {
    expect(scoreMatch("Home Alone", 1990, "Mi pobre angelito", "Home Alone", 1990)).toBe(1.3);
    expect(scoreMatch("In fraganti", 2009, "In the Loop", "In the Loop", 2009)).toBeLessThan(0.6);
    expect(scoreMatch("Klaus", 2019, "La leyenda de Klaus", "Klaus", 2021)).toBeLessThan(1);
  });

  it("cleans provider names", () => {
    expect(cleanProviderName("Amazon Prime Video")).toBe("Prime Video");
    expect(cleanProviderName("HBO Max Amazon Channel")).toBe("HBO Max (Prime Video)");
    expect(cleanProviderName("Netflix")).toBe("Netflix");
  });
});

import { describe, expect, it } from "vitest";
import { computeInsights, DEFAULT_RUNTIME, shareText } from "./insights";
import type { Movie, StreamingOffer } from "./types";

let n = 0;
function movie(over: Partial<Movie> = {}): Movie {
  n += 1;
  return {
    id: `m${n}`,
    title: `Película ${n}`,
    originalTitle: "",
    year: 2000,
    posterUrl: "",
    backdropUrl: "",
    synopsis: "",
    genres: [],
    runtimeMinutes: 90,
    trailerUrl: "",
    ratings: { imdb: null, rottenTomatoes: null, certifiedFresh: false },
    streaming: [],
    externalIds: {},
    watched: false,
    watchedAt: null,
    myRating: null,
    notes: "",
    favorite: false,
    source: "manual",
    lastSyncedAt: null,
    addedBy: null,
    suggestedBy: null,
    updatedBy: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

const offer = (provider: string, name: string, type: StreamingOffer["type"] = "flatrate"): StreamingOffer => ({ provider, name, type, url: "" });

describe("computeInsights", () => {
  it("handles an empty library", () => {
    const i = computeInsights([]);
    expect(i).toMatchObject({ total: 0, watched: 0, pending: 0, watchedPct: 0, topGenres: [], topPlatform: null, topRated: null, tone: null });
  });

  it("counts watched and pending movies and their hours", () => {
    const i = computeInsights([
      movie({ watched: true, runtimeMinutes: 120 }),
      movie({ watched: false, runtimeMinutes: 80 }),
      movie({ watched: false, runtimeMinutes: null }),
    ]);
    expect(i).toMatchObject({ total: 3, watched: 1, pending: 2, watchedPct: 33, watchedMinutes: 120, pendingMinutes: 80 + DEFAULT_RUNTIME });
  });

  it("ranks genres by share of movies and names the tone from the first", () => {
    const i = computeInsights([
      movie({ genres: ["Romance", "Comedia"] }),
      movie({ genres: ["Romance"] }),
      movie({ genres: ["Romance", "Romance"] }),
      movie({ genres: ["Acción"] }),
    ]);
    expect(i.topGenres[0]).toEqual({ genre: "Romance", count: 3, pct: 75 });
    expect(i.topGenres.map((g) => g.genre)).toEqual(["Romance", "Acción", "Comedia"]);
    expect(i.tone).toBe("Casa romántica");
  });

  it("falls back to a generic tone for genres without a label", () => {
    expect(computeInsights([movie({ genres: ["Western"] })]).tone).toBe("Casa navideña");
  });

  it("lists who suggests the most, ignoring movies without a suggester", () => {
    const i = computeInsights([movie({ suggestedBy: "ana" }), movie({ suggestedBy: "ana" }), movie({ suggestedBy: "luis" }), movie()]);
    expect(i.suggesters).toEqual([
      { profileId: "ana", count: 2 },
      { profileId: "luis", count: 1 },
    ]);
  });

  it("returns every suggester, not just the first few", () => {
    const i = computeInsights(["a", "b", "c", "d", "e", "f"].map((p) => movie({ suggestedBy: p })));
    expect(i.suggesters).toHaveLength(6);
  });

  it("picks the subscription service with most movies, counting each movie once", () => {
    const i = computeInsights([
      movie({ streaming: [offer("netflix", "Netflix"), offer("netflix", "Netflix", "ads"), offer("max", "HBO Max")] }),
      movie({ streaming: [offer("netflix", "Netflix")] }),
      movie({ streaming: [offer("max", "HBO Max", "rent")] }),
    ]);
    expect(i.topPlatform).toEqual({ name: "Netflix", count: 2 });
  });

  it("carries the logo of the top service", () => {
    const withLogo: StreamingOffer = { ...offer("netflix", "Netflix"), logoUrl: "https://logos.test/netflix.webp" };
    const i = computeInsights([movie({ streaming: [withLogo] })]);
    expect(i.topPlatform?.logoUrl).toBe("https://logos.test/netflix.webp");
  });

  it("merges Prime Video channels into their service", () => {
    const i = computeInsights([movie({ streaming: [offer("hbomaxamazonchannel", "HBO Max (Prime Video)")] }), movie({ streaming: [offer("max", "HBO Max")] })]);
    // The channel borrows the service's own logo.
    expect(i.topPlatform).toMatchObject({ name: "HBO Max", count: 2, logoUrl: expect.stringContaining("max.webp") });
  });

  it("finds the best rated movie by stars alone, with IMDb breaking ties", () => {
    const low = movie({ myRating: 5, ratings: { imdb: 6, rottenTomatoes: null, certifiedFresh: false } });
    const high = movie({ myRating: 5, ratings: { imdb: 7.5, rottenTomatoes: null, certifiedFresh: false } });
    // The heart does not make a movie the best rated.
    const hearted = movie({ myRating: 4, favorite: true });
    const i = computeInsights([movie({ myRating: 3 }), low, high, hearted, movie()]);
    expect(i.topRated?.id).toBe(high.id);
  });

  it("makes a favorite only of hearted movies, ordered by stars", () => {
    const unrated = movie({ favorite: true });
    const five = movie({ favorite: true, myRating: 5 });
    const three = movie({ favorite: true, myRating: 3 });
    // Five stars but no heart: best rated, not a favorite.
    const starsOnly = movie({ myRating: 5 });
    const i = computeInsights([unrated, three, starsOnly, five]);
    expect(i.favorites).toBe(3);
    expect(i.favoriteMovies.map((m) => m.id)).toEqual([five.id, three.id, unrated.id]);
  });

  it("has no favorites without a heart, even with five stars", () => {
    const i = computeInsights([movie({ myRating: 5 })]);
    expect(i.favorites).toBe(0);
    expect(i.favoriteMovies).toEqual([]);
  });
});

describe("shareText", () => {
  it("summarizes the house in a few lines", () => {
    const fav = movie({ title: "Elf", myRating: 5, favorite: true, genres: ["Comedia"], watched: true });
    const best = movie({ title: "Klaus", myRating: 5, genres: ["Comedia"], ratings: { imdb: 8, rottenTomatoes: null, certifiedFresh: false } });
    const text = shareText(computeInsights([fav, best]), "Casa Mora");
    expect(text).toContain("Casa Mora: Casa de risas");
    expect(text).toContain("1 de 2 películas vistas (50 %)");
    expect(text).toContain("Comedia 100 %");
    expect(text).toContain("Favoritas: Elf");
    expect(text).toContain("Mejor calificada: Klaus");
  });
});

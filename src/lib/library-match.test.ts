import { describe, expect, it } from "vitest";
import { buildLibraryIndex, findInLibrary } from "./library-match";

const index = buildLibraryIndex([
  { id: "1", title: "Mi pobre angelito", originalTitle: "Home Alone", year: 1990, externalIds: { justwatchId: "tm192233", imdbId: "tt0099785" } },
  { id: "2", title: "In fraganti", originalTitle: "In fraganti", year: 2009 },
  { id: "3", title: "El Grinch", originalTitle: "The Grinch", year: 2018, externalIds: { justwatchId: "tm2" } },
  { id: "4", title: "El Grinch", originalTitle: "How the Grinch Stole Christmas", year: 2000, externalIds: { justwatchId: "tm3" } },
]);

describe("findInLibrary", () => {
  it("matches by JustWatch id even if the title is written differently", () => {
    expect(findInLibrary(index, { title: "Solo en casa", year: 1990, externalIds: { justwatchId: "tm192233" } })?.id).toBe("1");
  });

  it("matches by IMDb id", () => {
    expect(findInLibrary(index, { title: "Whatever", year: 1990, externalIds: { imdbId: "tt0099785" } })?.id).toBe("1");
  });

  it("matches manually typed movies by normalized title and year", () => {
    expect(findInLibrary(index, { title: "In  Fraganti", year: 2009 })?.id).toBe("2");
    expect(findInLibrary(index, { title: "Mi Pobre Angelito", year: 1990 })?.id).toBe("1");
  });

  it("matches the original title too", () => {
    expect(findInLibrary(index, { title: "Solo en casa", originalTitle: "Home Alone", year: 1990 })?.id).toBe("1");
  });

  it("keeps same-named movies from different years apart", () => {
    expect(findInLibrary(index, { title: "El Grinch", year: 2018 })?.id).toBe("3");
    expect(findInLibrary(index, { title: "El Grinch", year: 2000 })?.id).toBe("4");
    expect(findInLibrary(index, { title: "El Grinch", year: 2010 })).toBeNull();
  });

  it("does not report a movie as its own duplicate when editing", () => {
    expect(findInLibrary(index, { title: "In fraganti", year: 2009 }, "2")).toBeNull();
  });

  it("returns null for movies that are not in the library", () => {
    expect(findInLibrary(index, { title: "Elf", year: 2003, externalIds: { justwatchId: "tm9" } })).toBeNull();
  });
});

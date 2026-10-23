import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getJustWatchTitle, MetadataError, searchBatch, searchJustWatch, searchPage } from "./justwatch";

/** The query text of every request sent while the test runs; answers are empty, only what is asked matters here. */
let queries: string[] = [];

beforeEach(() => {
  queries = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: { body: string }) => {
      const { query } = JSON.parse(init.body) as { query: string };
      queries.push(query);
      // One shape that satisfies every query: empty results, no title.
      return new Response(
        JSON.stringify({ data: { popularTitles: { edges: [], pageInfo: { endCursor: null, hasNextPage: false } }, node: null, q0: { edges: [] } } }),
        { status: 200 },
      );
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("JustWatch queries use the home's country", () => {
  it("asks for content and offers in that country, with its Spanish", async () => {
    await searchJustWatch("Home Alone", 1990, "MX");
    expect(queries.length).toBeGreaterThan(0);
    for (const q of queries) {
      expect(q).toContain('content(country: MX, language: "es-MX")');
      expect(q).toContain("offers(country: MX, platform: WEB)");
      expect(q).not.toMatch(/country: CO\b/);
    }
  });

  it("searches the country's catalog first, then the US one, still with the home's content", async () => {
    await searchJustWatch("Home Alone", 1990, "ES");
    expect(queries[0]).toContain("popularTitles(country: ES");
    expect(queries[1]).toContain("popularTitles(country: US");
    expect(queries[1]).toContain('content(country: ES, language: "es-ES")');
  });

  it("uses plain Spanish where the country has no Spanish of its own", async () => {
    await searchJustWatch("Home Alone", 1990, "DE");
    for (const q of queries) expect(q).toContain('content(country: DE, language: "es")');
  });

  it("applies to a saved title, a curated batch and a page of results", async () => {
    await getJustWatchTitle("tm192233", "AR");
    await searchBatch([{ title: "Elf", year: 2003 }], "AR");
    await searchPage("christmas", null, "AR");
    expect(queries).toHaveLength(3);
    for (const q of queries) {
      expect(q).toContain('content(country: AR, language: "es-AR")');
      expect(q).toContain("offers(country: AR, platform: WEB)");
    }
  });

  it("refuses a country that isn't on the list, since it would end up inside the query", async () => {
    await expect(searchJustWatch("Home Alone", 1990, "ZZ" as never)).rejects.toBeInstanceOf(MetadataError);
    await expect(searchJustWatch("Home Alone", 1990, "CO) { id } #" as never)).rejects.toBeInstanceOf(MetadataError);
    expect(queries).toHaveLength(0);
  });
});

import type { CountryCode } from "./countries";
import { findInLibrary, type LibraryIndex } from "./library-match";
import { searchPage } from "./metadata/justwatch";
import type { Candidate } from "./types";

/** Where the next "load more" continues: which search term, and the page cursor inside it. */
export interface SuggestionCursor {
  term: number;
  after: string | null;
}

const TERMS = ["christmas", "navidad", "santa claus", "xmas", "noel", "nochebuena", "holiday", "reindeer"];
const RELEVANT = /navidad|navide|christmas|xmas|santa|noel|nochebuena|holiday|reindeer|grinch|elfo/i;

export function isRelevant(c: Pick<Candidate, "title" | "originalTitle" | "synopsis">): boolean {
  return RELEVANT.test(`${c.title} ${c.originalTitle} ${c.synopsis}`);
}

/** Decent enough to suggest: a good public score, or a good critics score. */
export function isGoodEnough(c: Pick<Candidate, "ratings">): boolean {
  return (c.ratings.imdb ?? 0) >= 5.5 || (c.ratings.rottenTomatoes ?? 0) >= 60;
}

/**
 * More Christmas movies beyond the curated catalog, skipping what was already shown,
 * what is in the library, and anything that is not clearly about Christmas.
 */
export async function loadMoreSuggestions({
  seen,
  library,
  cursor,
  country,
  want = 12,
}: {
  seen: string[];
  library: LibraryIndex;
  cursor: SuggestionCursor | null;
  /** The home's country: where its offers come from. */
  country: CountryCode;
  want?: number;
}): Promise<{ items: Candidate[]; cursor: SuggestionCursor | null }> {
  const taken = new Set(seen);
  const items: Candidate[] = [];
  let term = cursor?.term ?? 0;
  let after = cursor?.after ?? null;

  // A few pages at most per click, so the answer stays fast.
  for (let pages = 0; items.length < want && term < TERMS.length && pages < 8; pages++) {
    const page = await searchPage(TERMS[term], after, country);
    for (const c of page.candidates) {
      if (taken.has(c.justwatchId) || !isRelevant(c) || !isGoodEnough(c) || findInLibrary(library, c)) continue;
      taken.add(c.justwatchId);
      items.push(c);
    }
    if (page.hasNextPage && page.endCursor) after = page.endCursor;
    else {
      term++;
      after = null;
    }
  }
  return { items, cursor: term >= TERMS.length ? null : { term, after } };
}

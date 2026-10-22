import { cacheLife, cacheTag } from "next/cache";
import type { Candidate } from "./types";
import { MetadataError, searchBatch } from "./metadata/justwatch";

/** Well-known Christmas movies (original title + release year). Extend freely. */
export const CHRISTMAS_CATALOG: { title: string; year: number }[] = [
  // Clásicas
  { title: "It's a Wonderful Life", year: 1946 },
  { title: "Miracle on 34th Street", year: 1947 },
  { title: "The Bishop's Wife", year: 1947 },
  { title: "White Christmas", year: 1954 },
  { title: "A Charlie Brown Christmas", year: 1965 },
  { title: "Santa Claus: The Movie", year: 1985 },
  { title: "A Christmas Story", year: 1983 },
  { title: "Mickey's Christmas Carol", year: 1983 },
  { title: "Gremlins", year: 1984 },
  { title: "Scrooged", year: 1988 },
  { title: "National Lampoon's Christmas Vacation", year: 1989 },
  { title: "Prancer", year: 1989 },
  { title: "Die Hard", year: 1988 },
  // 90s y 2000s
  { title: "The Muppet Christmas Carol", year: 1992 },
  { title: "Miracle on 34th Street", year: 1994 },
  { title: "Home Alone 3", year: 1997 },
  { title: "Jack Frost", year: 1998 },
  { title: "Serendipity", year: 2001 },
  { title: "The Santa Clause 2", year: 2002 },
  { title: "Bad Santa", year: 2003 },
  { title: "Surviving Christmas", year: 2004 },
  { title: "The Family Stone", year: 2005 },
  { title: "The Santa Clause 3: The Escape Clause", year: 2006 },
  { title: "Deck the Halls", year: 2006 },
  { title: "Fred Claus", year: 2007 },
  { title: "Four Christmases", year: 2008 },
  // 2010s
  { title: "Krampus", year: 2015 },
  { title: "The Night Before", year: 2015 },
  { title: "Office Christmas Party", year: 2016 },
  { title: "Better Watch Out", year: 2016 },
  { title: "A Christmas Prince", year: 2017 },
  { title: "The Man Who Invented Christmas", year: 2017 },
  { title: "A Bad Moms Christmas", year: 2017 },
  { title: "Daddy's Home 2", year: 2017 },
  { title: "Olaf's Frozen Adventure", year: 2017 },
  { title: "The Star", year: 2017 },
  { title: "The Holiday Calendar", year: 2018 },
  { title: "The Nutcracker and the Four Realms", year: 2018 },
  { title: "Last Christmas", year: 2019 },
  { title: "Let It Snow", year: 2019 },
  { title: "Holiday in the Wild", year: 2019 },
  // 2020s
  { title: "Jingle Jangle: A Christmas Journey", year: 2020 },
  { title: "Happiest Season", year: 2020 },
  { title: "Operation Christmas Drop", year: 2020 },
  { title: "Single All the Way", year: 2021 },
  { title: "Violent Night", year: 2022 },
  { title: "Spirited", year: 2022 },
  { title: "Dashing Through the Snow", year: 2023 },
  { title: "Candy Cane Lane", year: 2023 },
  { title: "Red One", year: 2024 },
  { title: "Nutcrackers", year: 2024 },
];

/** The best-known classics, offered once right after a home's first profile so the library doesn't start empty. */
export const STARTER_PICKS: { title: string; year: number }[] = [
  { title: "Home Alone", year: 1990 },
  { title: "Home Alone 2: Lost in New York", year: 1992 },
  { title: "How the Grinch Stole Christmas", year: 2000 },
  { title: "Elf", year: 2003 },
  { title: "The Polar Express", year: 2004 },
  { title: "Love Actually", year: 2003 },
  { title: "Klaus", year: 2019 },
  { title: "The Santa Clause", year: 1994 },
];

/** STARTER_PICKS with posters and data, in the same order. Cached and shared like the suggestion pool. */
export async function getStarterPicks(): Promise<Candidate[]> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 43200, expire: 604800 });
  cacheTag("starter");

  const found = (await searchBatch(STARTER_PICKS)).filter((c): c is Candidate => !!c);
  // An empty answer means JustWatch failed: throw so a failure is never cached.
  if (!found.length) throw new MetadataError("No pudimos cargar las películas sugeridas.");
  return found;
}

/**
 * Candidate pool for the "Sugeridas" page. Cached and shared: it knows nothing about
 * who is asking; the library is subtracted per request.
 */
export async function getSuggestionPool(): Promise<Candidate[]> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 43200, expire: 604800 });
  cacheTag("suggestions");

  const found = await searchBatch(CHRISTMAS_CATALOG);
  const byId = new Map<string, Candidate>();
  for (const c of found) if (c) byId.set(c.justwatchId, c);
  // An empty answer means JustWatch failed: throw so a failure is never cached.
  if (!byId.size) throw new MetadataError("No pudimos cargar las sugerencias. Intenta de nuevo en un momento.");
  return [...byId.values()];
}

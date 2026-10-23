import { isCountryCode, justwatchLanguage, type CountryCode } from "../countries";
import type { Candidate, OfferType, StreamingOffer } from "../types";

// Unofficial JustWatch GraphQL API: no key needed. Content and offers are requested for the home's own
// country, with that country's Spanish for titles (es-MX gives «Mi pobre angelito», es-ES «Solo en casa»).
const ENDPOINT = "https://apis.justwatch.com/graphql";
const IMG = "https://images.justwatch.com";

/** The fields every query asks for. `country` goes straight into the query text, so it must be a known code. */
function fields(country: CountryCode): string {
  if (!isCountryCode(country)) throw new MetadataError("País no válido.");
  return `
  id
  objectType
  content(country: ${country}, language: "${justwatchLanguage(country)}") {
    title
    originalTitle
    originalReleaseYear
    runtime
    shortDescription
    posterUrl
    backdrops { backdropUrl }
    genres { shortName }
    scoring { imdbScore imdbVotes tomatoMeter certifiedFresh }
    externalIds { imdbId tmdbId }
    clips { externalId provider }
  }
  offers(country: ${country}, platform: WEB) {
    monetizationType
    standardWebURL
    package { clearName technicalName icon }
  }
`;
}

interface JwNode {
  id: string;
  objectType: string;
  content: {
    title: string;
    originalTitle: string | null;
    originalReleaseYear: number | null;
    runtime: number | null;
    shortDescription: string | null;
    posterUrl: string | null;
    backdrops: { backdropUrl: string }[] | null;
    genres: { shortName: string }[] | null;
    scoring: { imdbScore: number | null; imdbVotes: number | null; tomatoMeter: number | null; certifiedFresh: boolean | null } | null;
    externalIds: { imdbId: string | null; tmdbId: string | null } | null;
    clips: { externalId: string; provider: string }[] | null;
  };
  offers: {
    monetizationType: string;
    standardWebURL: string | null;
    package: { clearName: string; technicalName: string; icon: string | null };
  }[];
}

export class MetadataError extends Error {
  name = "MetadataError";
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    throw new MetadataError("No pudimos conectar con JustWatch. Intenta de nuevo en un momento.");
  }
  if (!res.ok) throw new MetadataError(`JustWatch respondió con un error (${res.status}).`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (!json.data) throw new MetadataError(json.errors?.[0]?.message ?? "Respuesta inesperada de JustWatch.");
  return json.data;
}

const GENRES: Record<string, string> = {
  act: "Acción", ani: "Animación", cmy: "Comedia", crm: "Crimen", doc: "Documental", drm: "Drama",
  fml: "Familia", fnt: "Fantasía", hst: "Historia", hrr: "Terror", msc: "Música", rma: "Romance",
  scf: "Ciencia ficción", spt: "Deporte", trl: "Suspenso", war: "Bélica", wsn: "Western", rly: "Reality",
};

const OFFER_TYPES: Record<string, OfferType> = {
  FLATRATE: "flatrate", FREE: "free", ADS: "ads", RENT: "rent", BUY: "buy",
};

const NAME_FIXES: Record<string, string> = {
  "Disney Plus": "Disney+",
  "Amazon Prime Video": "Prime Video",
  "MovistarTV": "Movistar TV",
  "Apple TV Store": "Apple TV",
  "Apple TV Plus": "Apple TV+",
  "Paramount Plus": "Paramount+",
};

/** Lower index = shown first. Amazon/Apple "channels" go after the main services. */
const PROVIDER_ORDER = [
  "netflix", "disneyplus", "amazonprimevideo", "max", "movistarplay", "appletvplus", "paramountplus",
  "vix", "mubi", "plutotv", "itunes", "amazon", "googleplay",
];
const TYPE_ORDER: OfferType[] = ["flatrate", "free", "ads", "rent", "buy"];

function image(path: string | null | undefined, profile: string): string {
  if (!path) return "";
  return IMG + path.replace("/{profile}/.", "/{profile}/poster.").replace("{profile}", profile).replace("{format}", "webp");
}

export function cleanProviderName(name: string): string {
  if (NAME_FIXES[name]) return NAME_FIXES[name];
  if (/ Amazon Channel$/.test(name)) return `${name.replace(/ Amazon Channel$/, "")} (Prime Video)`;
  if (/ Apple TV [Cc]hannel$/.test(name)) return `${name.replace(/ Apple TV [Cc]hannel$/, "")} (Apple TV)`;
  return name;
}

export function mapOffers(offers: JwNode["offers"]): StreamingOffer[] {
  const seen = new Set<string>();
  const out: StreamingOffer[] = [];
  for (const o of offers ?? []) {
    const type = OFFER_TYPES[o.monetizationType];
    if (!type || !o.standardWebURL) continue;
    const key = `${o.package.technicalName}:${type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      provider: o.package.technicalName,
      name: cleanProviderName(o.package.clearName),
      logoUrl: o.package.icon ? image(o.package.icon, "s100") : undefined,
      type,
      url: o.standardWebURL,
    });
  }
  const rank = (p: string) => {
    const i = PROVIDER_ORDER.indexOf(p);
    return i === -1 ? PROVIDER_ORDER.length : i;
  };
  return out.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || rank(a.provider) - rank(b.provider));
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|of|and|in|a|an|el|la|los|las|un|una|de|del|en|y)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const tx = new Set(x.split(" "));
  const ty = new Set(y.split(" "));
  let common = 0;
  for (const t of tx) if (ty.has(t)) common++;
  const dice = (2 * common) / (tx.size + ty.size);
  const contains = x.includes(y) || y.includes(x) ? 0.15 : 0;
  return Math.min(1, dice + contains);
}

export function scoreMatch(query: string, year: number | undefined, title: string, originalTitle: string, foundYear: number | null): number {
  let score = Math.max(similarity(query, title), similarity(query, originalTitle));
  if (year && foundYear) {
    const gap = Math.abs(year - foundYear);
    score += gap === 0 ? 0.3 : gap === 1 ? 0.1 : -0.25;
  }
  return Math.round(score * 100) / 100;
}

export function trailerSearchUrl(title: string, year: number | null | undefined): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${year ?? ""} tráiler`.trim())}`;
}

export function toCandidate(node: JwNode, query: string, year?: number): Candidate {
  const c = node.content;
  const youtube = c.clips?.find((clip) => clip.provider === "YOUTUBE");
  return {
    justwatchId: node.id,
    score: scoreMatch(query, year, c.title, c.originalTitle ?? "", c.originalReleaseYear),
    title: c.title,
    originalTitle: c.originalTitle ?? "",
    year: c.originalReleaseYear ?? year ?? 0,
    posterUrl: image(c.posterUrl, "s718"),
    backdropUrl: image(c.backdrops?.[0]?.backdropUrl, "s1440"),
    synopsis: (c.shortDescription ?? "").trim(),
    genres: (c.genres ?? []).map((g) => GENRES[g.shortName]).filter((g): g is string => !!g),
    runtimeMinutes: c.runtime || null,
    trailerUrl: youtube
      ? `https://www.youtube.com/watch?v=${youtube.externalId}`
      : trailerSearchUrl(c.title, c.originalReleaseYear),
    ratings: {
      imdb: c.scoring?.imdbScore ?? null,
      imdbVotes: c.scoring?.imdbVotes ?? null,
      rottenTomatoes: c.scoring?.tomatoMeter ?? null,
      certifiedFresh: !!c.scoring?.certifiedFresh,
    },
    streaming: mapOffers(node.offers),
    externalIds: {
      justwatchId: node.id,
      imdbId: c.externalIds?.imdbId ?? undefined,
      tmdbId: c.externalIds?.tmdbId ?? undefined,
    },
  };
}

/** `catalog` is the country whose titles are searched; content and offers always come from `country`. */
function searchQuery(catalog: CountryCode, country: CountryCode, year?: number): string {
  const y = year && Number.isInteger(year) ? `, releaseYear: { min: ${year - 1}, max: ${year + 1} }` : "";
  return `query Search($q: String!) {
    popularTitles(country: ${catalog}, first: 6, filter: { searchQuery: $q, objectTypes: [MOVIE]${y} }) {
      edges { node { ${fields(country)} } }
    }
  }`;
}

async function searchIn(catalog: CountryCode, country: CountryCode, q: string, year?: number): Promise<JwNode[]> {
  const data = await gql<{ popularTitles: { edges: { node: JwNode }[] } }>(searchQuery(catalog, country, year), { q });
  return data.popularTitles.edges.map((e) => e.node).filter((n) => n.objectType === "MOVIE" && n.content);
}

/**
 * Finds the best matches for a title + year. The home's country catalog first; titles it
 * doesn't index (e.g. "That Christmas") come from the US catalog, still with
 * the home's own content and offers.
 */
export async function searchJustWatch(title: string, year: number | undefined, country: CountryCode): Promise<Candidate[]> {
  const q = title.trim();
  if (!q) return [];
  const byId = new Map<string, Candidate>();
  const add = (nodes: JwNode[]) => nodes.forEach((n) => byId.has(n.id) || byId.set(n.id, toCandidate(n, q, year)));
  const best = () => Math.max(0, ...[...byId.values()].map((c) => c.score));

  add(await searchIn(country, country, q, year));
  if (best() < 0.9) add(await searchIn("US", country, q, year));
  if (best() < 0.9 && year) add(await searchIn(country, country, q));

  const sorted = [...byId.values()].sort((a, b) => b.score - a.score);
  // With a clear winner, drop the loosely related titles JustWatch adds to its results.
  const floor = sorted[0]?.score >= 0.9 ? 0.75 : 0;
  return sorted.filter((c) => c.score >= floor).slice(0, 6);
}

export async function getJustWatchTitle(id: string, country: CountryCode): Promise<Candidate | null> {
  const data = await gql<{ node: JwNode | null }>(`query Title($id: ID!) { node(id: $id) { ... on Movie { ${fields(country)} } } }`, { id });
  if (!data.node?.content) return null;
  return toCandidate(data.node, data.node.content.title, data.node.content.originalReleaseYear ?? undefined);
}

/**
 * Looks up many known titles in one GraphQL request (aliases). Used for the curated
 * suggestions: the US catalog is broader, content and offers are the home's country.
 * Only confident matches are returned; the rest come back as null.
 */
export async function searchBatch(items: { title: string; year: number }[], country: CountryCode): Promise<(Candidate | null)[]> {
  const nodeFields = fields(country);
  const out: (Candidate | null)[] = items.map(() => null);
  const SIZE = 12;
  const jobs: Promise<void>[] = [];
  for (let start = 0; start < items.length; start += SIZE) {
    const slice = items.slice(start, start + SIZE);
    const body = slice
      .map(
        (it, i) =>
          `q${i}: popularTitles(country: US, first: 3, filter: { searchQuery: ${JSON.stringify(it.title)}, releaseYear: { min: ${it.year - 1}, max: ${it.year + 1} }, objectTypes: [MOVIE] }) { edges { node { ${nodeFields} } } }`,
      )
      .join("\n");
    jobs.push(
      gql<Record<string, { edges: { node: JwNode }[] }>>(`query Batch { ${body} }`, {})
        .then((data) => {
          slice.forEach((it, i) => {
            const best = (data[`q${i}`]?.edges ?? [])
              .map((e) => e.node)
              .filter((n) => n.objectType === "MOVIE" && n.content)
              .map((n) => toCandidate(n, it.title, it.year))
              .sort((a, b) => b.score - a.score)[0];
            if (best && best.score >= 1.1) out[start + i] = best;
          });
        })
        // One failed chunk must not sink the whole list.
        .catch(() => undefined),
    );
  }
  await Promise.all(jobs);
  return out;
}

export interface SearchPage {
  candidates: Candidate[];
  endCursor: string | null;
  hasNextPage: boolean;
}

/** One page of movies for a search term, most popular first (US catalog, the home's country offers). */
export async function searchPage(term: string, after: string | null, country: CountryCode, first = 40): Promise<SearchPage> {
  const afterArg = after ? `, after: ${JSON.stringify(after)}` : "";
  const data = await gql<{ popularTitles: { pageInfo: { endCursor: string | null; hasNextPage: boolean }; edges: { node: JwNode }[] } }>(
    `query Page { popularTitles(country: US, first: ${first}${afterArg}, filter: { searchQuery: ${JSON.stringify(term)}, objectTypes: [MOVIE] }) { pageInfo { endCursor hasNextPage } edges { node { ${fields(country)} } } } }`,
    {},
  );
  const page = data.popularTitles;
  return {
    candidates: page.edges.map((e) => e.node).filter((n) => n.objectType === "MOVIE" && n.content).map((n) => toCandidate(n, term)),
    endCursor: page.pageInfo.endCursor,
    hasNextPage: page.pageInfo.hasNextPage,
  };
}

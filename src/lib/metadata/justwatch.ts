import type { Candidate, OfferType, StreamingOffer } from "../types";

// Unofficial JustWatch GraphQL API: no key needed. Content and offers are always
// requested for Colombia (es-CO gives Latin American titles: "Mi pobre angelito").
const ENDPOINT = "https://apis.justwatch.com/graphql";
const IMG = "https://images.justwatch.com";

const FIELDS = `
  id
  objectType
  content(country: CO, language: "es-CO") {
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
  offers(country: CO, platform: WEB) {
    monetizationType
    standardWebURL
    package { clearName technicalName icon }
  }
`;

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

function searchQuery(country: "CO" | "US", year?: number): string {
  const y = year && Number.isInteger(year) ? `, releaseYear: { min: ${year - 1}, max: ${year + 1} }` : "";
  return `query Search($q: String!) {
    popularTitles(country: ${country}, first: 6, filter: { searchQuery: $q, objectTypes: [MOVIE]${y} }) {
      edges { node { ${FIELDS} } }
    }
  }`;
}

async function searchIn(country: "CO" | "US", q: string, year?: number): Promise<JwNode[]> {
  const data = await gql<{ popularTitles: { edges: { node: JwNode }[] } }>(searchQuery(country, year), { q });
  return data.popularTitles.edges.map((e) => e.node).filter((n) => n.objectType === "MOVIE" && n.content);
}

/**
 * Finds the best matches for a title + year. Colombia's catalog first; titles it
 * doesn't index (e.g. "That Christmas") come from the US catalog, still with
 * Colombian content and offers.
 */
export async function searchJustWatch(title: string, year?: number): Promise<Candidate[]> {
  const q = title.trim();
  if (!q) return [];
  const byId = new Map<string, Candidate>();
  const add = (nodes: JwNode[]) => nodes.forEach((n) => byId.has(n.id) || byId.set(n.id, toCandidate(n, q, year)));
  const best = () => Math.max(0, ...[...byId.values()].map((c) => c.score));

  add(await searchIn("CO", q, year));
  if (best() < 0.9) add(await searchIn("US", q, year));
  if (best() < 0.9 && year) add(await searchIn("CO", q));

  const sorted = [...byId.values()].sort((a, b) => b.score - a.score);
  // With a clear winner, drop the loosely related titles JustWatch adds to its results.
  const floor = sorted[0]?.score >= 0.9 ? 0.75 : 0;
  return sorted.filter((c) => c.score >= floor).slice(0, 6);
}

export async function getJustWatchTitle(id: string): Promise<Candidate | null> {
  const data = await gql<{ node: JwNode | null }>(`query Title($id: ID!) { node(id: $id) { ... on Movie { ${FIELDS} } } }`, { id });
  if (!data.node?.content) return null;
  return toCandidate(data.node, data.node.content.title, data.node.content.originalReleaseYear ?? undefined);
}

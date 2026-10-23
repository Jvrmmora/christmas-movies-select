/**
 * The household's initial list. Idempotent: existing title+year pairs are skipped.
 * Run: pnpm seed [--email tu@correo.com]   (needs .env.local; without --email it fills the original home).
 * Also used by scripts/demo.mts.
 */
import { parseArgs } from "node:util";
import { LEGACY_COUNTRY } from "../src/lib/countries";
import { collections, LEGACY_HOME_ID, type MovieDoc } from "../src/lib/db";
import { enrich, lookupMovie } from "../src/lib/metadata";
import { normalize } from "../src/lib/metadata/justwatch";
import type { MovieData } from "../src/lib/types";

interface Entry {
  /** Name as the household wrote it. */
  title: string;
  /** Search by original title + real release year for an exact match. */
  query: string;
  year: number;
  expect?: string;
  notes?: string;
}

const LIST: Entry[] = [
  { title: "Klaus", query: "Klaus", year: 2019 },
  { title: "Home Alone", query: "Home Alone", year: 1990 },
  { title: "Home Alone 2", query: "Home Alone 2: Lost in New York", year: 1992 },
  { title: "Noelle", query: "Noelle", year: 2019 },
  { title: "Operación regalo", query: "Arthur Christmas", year: 2011 },
  { title: "Intercambio de princesas", query: "The Princess Switch", year: 2018 },
  { title: "Intercambio de princesas 2", query: "The Princess Switch: Switched Again", year: 2020 },
  { title: "Intercambio de princesas 3", query: "The Princess Switch 3: Romancing the Star", year: 2021 },
  { title: "Un príncipe de Navidad: La boda real", query: "A Christmas Prince: The Royal Wedding", year: 2018 },
  { title: "Un príncipe de Navidad: Bebé real", query: "A Christmas Prince: The Royal Baby", year: 2019 },
  { title: "Navidad de golpe", query: "Falling for Christmas", year: 2022 },
  { title: "Crónicas de Navidad", query: "The Christmas Chronicles", year: 2018 },
  { title: "Crónicas de Navidad 2", query: "The Christmas Chronicles: Part Two", year: 2020 },
  { title: "El regalo prometido", query: "Jingle All the Way", year: 1996 },
  { title: "Elf, el duende", query: "Elf", year: 2003 },
  { title: "El Grinch", query: "How the Grinch Stole Christmas", year: 2000, notes: "Con Jim Carrey" },
  { title: "El Grinch", query: "The Grinch", year: 2018, notes: "La animada" },
  { title: "Los fantasmas de Scrooge", query: "A Christmas Carol", year: 2009 },
  { title: "Amor de calendario", query: "Holidate", year: 2020 },
  { title: "Equipaje de mano", query: "Carry-On", year: 2024 },
  { title: "Aquella Navidad", query: "That Christmas", year: 2024 },
  { title: "Iron Man 3", query: "Iron Man 3", year: 2013 },
  { title: "Harry Potter y la piedra filosofal", query: "Harry Potter and the Philosopher's Stone", year: 2001 },
  { title: "Nos vemos la próxima Navidad", query: "Meet Me Next Christmas", year: 2024, notes: "Con Pentatonix" },
  { title: "¡Qué duro es el amor!", query: "Love Hard", year: 2021 },
  { title: "El expreso polar", query: "The Polar Express", year: 2004 },
  { title: "Mientras dormías", query: "While You Were Sleeping", year: 1995 },
  { title: "El caballero de la Navidad", query: "The Knight Before Christmas", year: 2019 },
  { title: "Una Navidad de locos", query: "Christmas with the Kranks", year: 2004 },
  { title: "Realmente amor", query: "Love Actually", year: 2003 },
  { title: "El origen de los guardianes", query: "Rise of the Guardians", year: 2012 },
  { title: "El descanso", query: "The Holiday", year: 2006 },
];

// Colombian film not indexed by JustWatch: stored with what we know for sure.
const MANUAL: (MovieData & { notes: string })[] = [
  {
    title: "In fraganti",
    originalTitle: "In fraganti",
    year: 2009,
    posterUrl: "",
    backdropUrl: "",
    synopsis: "",
    genres: [],
    runtimeMinutes: null,
    trailerUrl: "https://www.youtube.com/results?search_query=In%20fraganti%202009%20pel%C3%ADcula%20colombiana",
    ratings: { imdb: null, imdbVotes: null, rottenTomatoes: null, certifiedFresh: false },
    streaming: [],
    externalIds: {},
    notes: "Película colombiana",
  },
];

export async function seedList(ownerId: string = LEGACY_HOME_ID) {
  const { movies } = await collections();
  let created = 0;

  const insert = async (data: MovieData, notes: string, source: "auto" | "manual") => {
    const now = new Date();
    try {
      await movies.insertOne({
        ...data,
        ownerId,
        watched: false,
        watchedAt: null,
        myRating: null,
        notes,
        favorite: false,
        source,
        lastSyncedAt: source === "auto" ? now : null,
        createdAt: new Date(now.getTime() + created),
        updatedAt: now,
      } as MovieDoc);
      created++;
      return true;
    } catch (err) {
      if ((err as { code?: number }).code === 11000) return false;
      throw err;
    }
  };

  for (const e of LIST) {
    // The original home's list: it was made for (and looks up availability in) the legacy country.
    const candidates = await lookupMovie(e.query, e.year, LEGACY_COUNTRY);
    const match =
      candidates.find((c) => normalize(c.originalTitle) === normalize(e.query) && Math.abs(c.year - e.year) <= 1) ?? candidates[0];
    if (!match) {
      console.log(`✗ ${e.title} (${e.year}): sin resultados`);
      continue;
    }
    const { justwatchId: _id, score: _score, ...data } = await enrich(match);
    const ok = await insert({ ...data, title: e.title }, e.notes ?? "", "auto");
    const subs = data.streaming.filter((o) => ["flatrate", "free", "ads"].includes(o.type)).map((o) => o.name);
    console.log(
      `${ok ? "✓" : "·"} ${e.title} (${data.year}) ← ${match.title} [${match.originalTitle}] · IMDb ${data.ratings.imdb ?? "—"} · RT ${data.ratings.rottenTomatoes ?? "—"} · ${subs.join(", ") || "sin suscripción"}${ok ? "" : " (ya existía)"}`,
    );
  }

  for (const m of MANUAL) {
    const { notes, ...data } = m;
    const ok = await insert(data, notes, "manual");
    console.log(`${ok ? "✓" : "·"} ${m.title} (${m.year}) ← manual, sin plataforma`);
  }

  console.log(`\n${created} películas nuevas · total en la base: ${await movies.countDocuments({ ownerId })}`);
}

async function homeFromArgs(): Promise<string> {
  const { values } = parseArgs({ options: { email: { type: "string" } } });
  if (!values.email) return LEGACY_HOME_ID;
  const { users } = await collections();
  const user = await users.findOne({ email: values.email.trim().toLowerCase() });
  if (!user?.homeId) throw new Error(`No hay una cuenta con casa para "${values.email}".`);
  return user.homeId;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  homeFromArgs()
    .then(seedList)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

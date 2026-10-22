import { z } from "zod";
import { DATE_KEY } from "./calendar";
import { ACCESSORIES, BACKGROUND_IDS, CHARACTERS } from "./avatar";

const isHttpUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

const urlOrEmpty = z
  .string()
  .trim()
  .max(1500)
  .refine((v) => v === "" || isHttpUrl(v), "Debe ser un enlace que empiece por https://");

export const offerSchema = z.object({
  provider: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1, "Falta el nombre de la plataforma").max(60),
  logoUrl: urlOrEmpty.optional(),
  type: z.enum(["flatrate", "free", "ads", "rent", "buy"]),
  url: z.string().trim().max(1500).refine(isHttpUrl, "Cada plataforma necesita un enlace válido"),
});

export const movieInputSchema = z.object({
  title: z.string().trim().min(1, "Escribe el título").max(200),
  originalTitle: z.string().trim().max(200).default(""),
  year: z.number({ error: "Escribe el año" }).int().min(1900, "Año no válido").max(2100, "Año no válido"),
  posterUrl: urlOrEmpty.default(""),
  backdropUrl: urlOrEmpty.default(""),
  synopsis: z.string().trim().max(5000).default(""),
  genres: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  runtimeMinutes: z.number().int().min(1).max(600).nullable().default(null),
  trailerUrl: urlOrEmpty.default(""),
  ratings: z.object({
    imdb: z.number().min(0).max(10).nullable(),
    imdbVotes: z.number().int().min(0).nullable().optional(),
    rottenTomatoes: z.number().int().min(0).max(100).nullable(),
    certifiedFresh: z.boolean(),
  }),
  streaming: z.array(offerSchema).max(40).default([]),
  externalIds: z
    .object({
      imdbId: z.string().max(40).optional(),
      tmdbId: z.string().max(40).optional(),
      justwatchId: z.string().max(40).optional(),
    })
    .default({}),
  favorite: z.boolean().default(false),
  watched: z.boolean().default(false),
  myRating: z.number().int().min(1).max(5).nullable().default(null),
  notes: z.string().trim().max(2000).default(""),
  source: z.enum(["auto", "manual"]).default("manual"),
  calendarDate: z.string().regex(DATE_KEY).nullable().optional(),
  /** Profile id. Checked against the home's profiles by the action; undefined = the person saving. */
  suggestedBy: z.string().max(64).nullable().optional(),
});

export type MovieInput = z.input<typeof movieInputSchema>;
export type MovieInputParsed = z.output<typeof movieInputSchema>;

export const calendarPatchSchema = z.object({
  preset: z.enum(["today", "nov", "dec", "custom"]).optional(),
  startDate: z.string().regex(DATE_KEY).optional(),
  /** Sent by the range picker's "Guardar": marks the calendar as set up. */
  configured: z.literal(true).optional(),
  assignments: z.record(z.string().regex(DATE_KEY), z.string().regex(/^[a-f0-9]{24}$/)).optional(),
  surprise: z.boolean().optional(),
});

export type CalendarPatch = z.input<typeof calendarPatchSchema>;

export const avatarSchema = z.object({
  character: z.enum(CHARACTERS),
  bg: z.enum(BACKGROUND_IDS),
  accessory: z.enum(ACCESSORIES),
});

export const profileInputSchema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre al perfil").max(16, "Máximo 16 letras"),
  avatar: avatarSchema,
});

export type ProfileInput = z.input<typeof profileInputSchema>;

export const passwordSchema = z
  .string()
  .min(6, "La clave necesita al menos 6 caracteres")
  .max(100, "La clave es demasiado larga");

export const homeNameSchema = z.string().trim().min(1, "Ponle un nombre a la casa").max(40, "Máximo 40 letras");

/** Lowercased so "Ana@Gmail.com" and "ana@gmail.com" are the same address (and the same unique key). */
export const emailSchema = z.string().trim().toLowerCase().max(254, "Ese correo es demasiado largo").pipe(z.email("Escribe un correo válido"));

/** Step 1 of sign-up: one person's account. */
export const accountInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/** The six digits from the e-mail; spaces and dashes are ignored ("123 456"). */
export const resetCodeSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^\d{6}$/, "El código tiene 6 números"));

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Revisa los datos";
}

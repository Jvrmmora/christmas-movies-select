"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Check, ChevronDown, ChevronLeft, Clapperboard, Lock, Plus, Search, Trash2, WandSparkles, X } from "lucide-react";
import { toast } from "sonner";
import { createMovieAction, searchMoviesAction, updateMovieAction } from "@/actions/movies";
import { ProfileChips } from "@/components/profiles/profile-chips";
import { useProfiles } from "@/components/profiles/profiles-provider";
import { usePrefs } from "@/components/providers";
import { useNow } from "@/components/use-now";
import { Poster, ProviderLogo } from "@/components/ui/poster";
import { ImdbLogo } from "@/components/ui/rating-badges";
import { SwitchButton, SwitchTrack } from "@/components/ui/switch";
import { KNOWN_PLATFORMS } from "@/lib/platforms";
import { formatScore, OFFER_LABEL } from "@/lib/format";
import { parseKey, rangeDays, toKey } from "@/lib/calendar";
import type { CalendarState, Candidate, ExternalIds, Movie, MovieData, OfferType, StreamingOffer } from "@/lib/types";
import type { MovieInput } from "@/lib/validation";

interface FormState {
  title: string;
  originalTitle: string;
  year: string;
  runtime: string;
  posterUrl: string;
  backdropUrl: string;
  synopsis: string;
  genres: string[];
  imdb: string;
  imdbVotes: number | null;
  rt: string;
  certifiedFresh: boolean;
  streaming: StreamingOffer[];
  noPlatform: boolean;
  trailerUrl: string;
  externalIds: ExternalIds;
  source: "auto" | "manual";
  favorite: boolean;
  watched: boolean;
  myRating: number | null;
  notes: string;
  calendarDate: string;
  /** Profile id; "" when nobody is credited. */
  suggestedBy: string;
}

const EMPTY: FormState = {
  title: "", originalTitle: "", year: "", runtime: "", posterUrl: "", backdropUrl: "", synopsis: "", genres: [],
  imdb: "", imdbVotes: null, rt: "", certifiedFresh: false, streaming: [], noPlatform: false, trailerUrl: "",
  externalIds: {}, source: "manual", favorite: false, watched: false, myRating: null, notes: "", calendarDate: "", suggestedBy: "",
};

const GENRE_OPTIONS = ["Navideña", "Comedia", "Romance", "Familia", "Animación", "Fantasía", "Acción", "Aventura", "Drama", "Musical", "Suspenso", "Crimen"];

function dataFields(d: MovieData): Partial<FormState> {
  return {
    title: d.title,
    originalTitle: d.originalTitle,
    year: d.year ? String(d.year) : "",
    runtime: d.runtimeMinutes ? String(d.runtimeMinutes) : "",
    posterUrl: d.posterUrl,
    backdropUrl: d.backdropUrl,
    synopsis: d.synopsis,
    genres: d.genres,
    imdb: d.ratings.imdb !== null ? formatScore(d.ratings.imdb) : "",
    imdbVotes: d.ratings.imdbVotes ?? null,
    rt: d.ratings.rottenTomatoes !== null ? String(d.ratings.rottenTomatoes) : "",
    certifiedFresh: d.ratings.certifiedFresh,
    streaming: d.streaming,
    noPlatform: d.streaming.length === 0,
    trailerUrl: d.trailerUrl,
    externalIds: d.externalIds,
  };
}

function fromMovie(m: Movie, calendarDate: string | null, knownProfile: (id: string) => boolean): FormState {
  return {
    ...EMPTY,
    ...dataFields(m),
    source: m.source,
    favorite: m.favorite,
    watched: m.watched,
    myRating: m.myRating,
    notes: m.notes,
    calendarDate: calendarDate ?? "",
    // A person who left the home can no longer be credited; the server would reject their id.
    suggestedBy: m.suggestedBy && knownProfile(m.suggestedBy) ? m.suggestedBy : "",
  };
}

function toInput(f: FormState): MovieInput | string {
  const year = Number.parseInt(f.year, 10);
  if (!f.title.trim()) return "Escribe el título";
  if (!Number.isInteger(year)) return "Escribe el año";
  const runtime = f.runtime ? Number.parseInt(f.runtime, 10) : null;
  const imdb = f.imdb ? Number.parseFloat(f.imdb.replace(",", ".")) : null;
  const rt = f.rt ? Number.parseInt(f.rt, 10) : null;
  if (imdb !== null && (!Number.isFinite(imdb) || imdb < 0 || imdb > 10)) return "La puntuación de IMDb va de 0 a 10";
  if (rt !== null && (!Number.isFinite(rt) || rt < 0 || rt > 100)) return "El Tomatómetro va de 0 a 100";
  return {
    title: f.title,
    originalTitle: f.originalTitle,
    year,
    posterUrl: f.posterUrl,
    backdropUrl: f.backdropUrl,
    synopsis: f.synopsis,
    genres: f.genres,
    runtimeMinutes: runtime && Number.isFinite(runtime) ? runtime : null,
    trailerUrl: f.trailerUrl,
    ratings: { imdb, imdbVotes: f.imdbVotes, rottenTomatoes: rt, certifiedFresh: f.certifiedFresh && rt !== null && rt >= 60 },
    streaming: f.noPlatform ? [] : f.streaming.map((o) => ({ ...o, logoUrl: o.logoUrl || undefined })),
    externalIds: f.externalIds,
    favorite: f.favorite,
    watched: f.watched,
    myRating: f.myRating,
    notes: f.notes,
    source: f.source,
    calendarDate: f.calendarDate || null,
    suggestedBy: f.suggestedBy || null,
  };
}

const field = "h-12 w-full rounded-xl border border-line bg-field px-3.5 text-base text-ink";
const labelCls = "flex flex-col gap-1.5 text-[13px] font-semibold text-ink-2";
const dayFmt = new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", month: "short" });

export function MovieForm({ movie, calendar, calendarDate = null }: { movie?: Movie; calendar: CalendarState; calendarDate?: string | null }) {
  const editing = !!movie;
  const router = useRouter();
  const { play } = usePrefs();
  const now = useNow();
  const { current, byId } = useProfiles();
  const [f, setF] = useState<FormState>(() => (movie ? fromMovie(movie, calendarDate, (id) => byId.has(id)) : { ...EMPTY, suggestedBy: current.id }));
  const [qName, setQName] = useState(movie?.originalTitle || movie?.title || "");
  const [qYear, setQYear] = useState(movie ? String(movie.year) : "");
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [picked, setPicked] = useState<string | null>(movie?.externalIds.justwatchId ?? null);
  const [lookupOpen, setLookupOpen] = useState(!editing);
  const [searching, startSearch] = useTransition();
  const [saving, startSave] = useTransition();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setF((s) => ({ ...s, [key]: value }));

  const applyCandidate = (c: Candidate) => {
    setPicked(c.justwatchId);
    setF((s) => ({ ...s, ...dataFields(c), source: "auto" }));
    play("jingle");
  };

  const search = () => {
    const year = Number.parseInt(qYear, 10);
    startSearch(async () => {
      const res = await searchMoviesAction(qName, Number.isInteger(year) ? year : undefined, movie?.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCandidates(res.data);
      if (!res.data.length) {
        toast("No encontramos esa película. Pueden llenar los datos a mano.");
        setF((s) => ({ ...s, title: s.title || qName, year: s.year || qYear }));
        return;
      }
      const best = res.data[0];
      if (best.inLibrary && best.score >= 0.9) {
        toast.warning(`Ya lo tienes en tu biblioteca: «${best.inLibrary.title}»`);
        play("tick");
      } else if (!editing && best.score >= 0.9) applyCandidate(best);
    });
  };

  const days = useMemo(() => {
    const today = now ? toKey(now) : calendar.startDate;
    const all = rangeDays(calendar.startDate, calendar.endDate).filter((k) => k >= today || k === f.calendarDate);
    const taken = new Set(Object.entries(calendar.assignments).filter(([, id]) => id !== movie?.id).map(([k]) => k));
    return all.map((k) => ({ key: k, label: dayFmt.format(parseKey(k)).replace(/\./g, ""), taken: taken.has(k) }));
  }, [calendar, now, movie?.id, f.calendarDate]);

  const save = () => {
    const input = toInput(f);
    if (typeof input === "string") {
      toast.error(input);
      return;
    }
    startSave(async () => {
      const res = movie ? await updateMovieAction(movie.id, input) : await createMovieAction(input);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      play("jingle");
      toast.success(movie ? "Cambios guardados" : `«${input.title}» quedó en su lista`);
      const id = movie ? movie.id : "data" in res ? (res.data as { id: string }).id : "";
      router.push(id ? `/peliculas/${id}` : "/peliculas");
    });
  };

  const addPlatform = (p: (typeof KNOWN_PLATFORMS)[number]) => {
    const q = encodeURIComponent(f.originalTitle || f.title || qName);
    setF((s) => ({
      ...s,
      noPlatform: false,
      streaming: [...s.streaming, { provider: p.provider, name: p.name, logoUrl: p.logoUrl || undefined, type: "flatrate", url: p.search(q) }],
    }));
  };

  const updateOffer = (i: number, patch: Partial<StreamingOffer>) =>
    setF((s) => ({ ...s, streaming: s.streaming.map((o, j) => (j === i ? { ...o, ...patch } : o)) }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="mx-auto flex max-w-[1040px] flex-col gap-7"
    >
      <div>
        <Link href={movie ? `/peliculas/${movie.id}` : "/peliculas"} className="inline-flex items-center gap-1 text-sm font-semibold text-berry-ink">
          <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
          {movie ? movie.title : "Películas"}
        </Link>
        <h1 className="mt-2.5 text-4xl leading-[1.05] font-bold tracking-[-0.03em] sm:text-[44px]">{editing ? "Editar película" : "Agregar película"}</h1>
        <p className="mt-2 text-[17px] text-ink-2">
          {editing ? "Todos los campos se pueden cambiar." : "Escriban el nombre y el año. El póster, la sinopsis, las puntuaciones y dónde verla se llenan solos."}
        </p>
      </div>

      <section aria-labelledby="busqueda" className="flex flex-col gap-5 rounded-3xl bg-surface p-5 shadow-card sm:p-7">
        <button
          type="button"
          onClick={() => setLookupOpen((o) => !o)}
          aria-expanded={lookupOpen}
          className="flex items-center gap-2.5 text-left"
        >
          <span className="grid size-8 place-items-center rounded-[10px] bg-gold-soft text-gold-ink">
            <WandSparkles className="size-[18px]" strokeWidth={1.8} aria-hidden />
          </span>
          <h2 id="busqueda" className="flex-1 text-[19px] font-bold">
            {editing ? "Volver a buscar datos" : "Búsqueda automática"}
          </h2>
          <ChevronDown className={`size-5 text-ink-2 transition-transform ${lookupOpen ? "rotate-180" : ""}`} aria-hidden />
        </button>
        {lookupOpen && (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <label className={`${labelCls} flex-[999_1_300px]`}>
                Nombre de la película
                <input
                  value={qName}
                  onChange={(e) => setQName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      search();
                    }
                  }}
                  placeholder="Ej. Home Alone o Mi pobre angelito"
                  className={`${field} h-[50px] text-[17px]`}
                />
              </label>
              <label className={`${labelCls} flex-[1_1_110px]`}>
                Año
                <input
                  value={qYear}
                  onChange={(e) => setQYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      search();
                    }
                  }}
                  inputMode="numeric"
                  placeholder="1990"
                  className={`${field} h-[50px] text-[17px] tabular-nums`}
                />
              </label>
              <button
                type="button"
                onClick={search}
                disabled={searching || !qName.trim()}
                className="nv-press inline-flex h-[50px] flex-none items-center gap-2 rounded-[14px] bg-berry px-[22px] text-base font-semibold text-white disabled:opacity-60"
              >
                <Search className="size-[18px]" strokeWidth={2} aria-hidden />
                {searching ? "Buscando…" : "Buscar"}
              </button>
            </div>
            {searching && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3" role="status" aria-label="Buscando">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3 rounded-2xl border-[1.5px] border-line p-2.5">
                    <div className="nv-shimmer h-[84px] w-14 rounded-lg" />
                    <div className="flex flex-1 flex-col gap-2 pt-1.5">
                      <div className="nv-shimmer h-3.5 w-4/5 rounded-md" />
                      <div className="nv-shimmer h-3 w-2/5 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!searching && candidates && candidates.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <div className="text-[13px] text-ink-2">
                  {candidates.length} {candidates.length === 1 ? "coincidencia" : "coincidencias"} en JustWatch Colombia · elijan la correcta
                </div>
                <div role="radiogroup" aria-label="Coincidencias" className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
                  {candidates.map((c) => {
                    const on = picked === c.justwatchId;
                    if (c.inLibrary) {
                      return (
                        <div
                          key={c.justwatchId}
                          role="radio"
                          aria-checked="false"
                          aria-disabled="true"
                          className="relative flex gap-3 rounded-2xl border-2 border-dashed border-line bg-surface-2/60 p-2.5 text-left"
                        >
                          <div className="opacity-50 grayscale">
                            <Poster src={c.posterUrl} title={c.title} className="h-[84px] w-14 shrink-0 rounded-lg" />
                          </div>
                          <span className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
                            <span className="text-[15px] leading-tight font-semibold text-ink-2">{c.title}</span>
                            <span className="truncate text-[13px] text-ink-2">
                              {c.year}
                              {c.originalTitle && c.originalTitle !== c.title ? ` · ${c.originalTitle}` : ""}
                            </span>
                            <span className="mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1 text-xs font-bold text-gold-ink">
                              <Lock className="size-3" strokeWidth={2.4} aria-hidden />
                              Ya lo tienes en tu biblioteca
                            </span>
                            <Link href={`/peliculas/${c.inLibrary.id}`} className="w-fit text-xs font-semibold text-berry-ink hover:underline">
                              Ver «{c.inLibrary.title}»
                            </Link>
                          </span>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={c.justwatchId}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => applyCandidate(c)}
                        className={`nv-lift relative flex gap-3 rounded-2xl border-2 p-2.5 text-left text-ink ${on ? "border-check bg-surface-2" : "border-line"}`}
                      >
                        <Poster src={c.posterUrl} title={c.title} className="h-[84px] w-14 shrink-0 rounded-lg" />
                        <span className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
                          <span className="text-[15px] leading-tight font-semibold">{c.title}</span>
                          <span className="truncate text-[13px] text-ink-2">
                            {c.year}
                            {c.originalTitle && c.originalTitle !== c.title ? ` · ${c.originalTitle}` : ""}
                          </span>
                          <span className="inline-flex items-center gap-2 text-xs font-semibold">
                            {c.ratings.imdb !== null && (
                              <span className="inline-flex items-center gap-1">
                                <ImdbLogo className="h-[13px]" />
                                {formatScore(c.ratings.imdb)}
                              </span>
                            )}
                            {c.ratings.rottenTomatoes !== null && <span>RT {c.ratings.rottenTomatoes}%</span>}
                          </span>
                        </span>
                        {on && (
                          <span aria-hidden className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-check text-check-ink">
                            <Check className="size-3.5" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="datos" className="flex flex-wrap gap-7 rounded-3xl bg-surface p-5 shadow-card sm:p-7">
        <div className="flex w-full max-w-[260px] flex-[1_1_200px] flex-col gap-2.5 max-sm:mx-auto">
          <Poster src={f.posterUrl} title={f.title || "Póster"} className="aspect-[2/3] w-full rounded-2xl shadow-card" />
          <label className={labelCls}>
            Póster (URL de imagen)
            <input type="url" value={f.posterUrl} onChange={(e) => set("posterUrl", e.target.value)} placeholder="https://…" className={`${field} h-11 text-[13px]`} />
          </label>
        </div>

        <div className="flex min-w-0 flex-[999_1_440px] flex-col gap-[18px]">
          <h2 id="datos" className="text-[19px] font-bold">
            Datos de la película
          </h2>
          <label className={labelCls}>
            Título
            <input value={f.title} onChange={(e) => set("title", e.target.value)} required maxLength={200} className={field} />
            <span className="text-xs font-normal">Así aparecerá en la app. Pueden poner el nombre con el que ustedes la conocen.</span>
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className={`${labelCls} col-span-2`}>
              Título original
              <input value={f.originalTitle} onChange={(e) => set("originalTitle", e.target.value)} maxLength={200} className={field} />
            </label>
            <label className={labelCls}>
              Año
              <input
                value={f.year}
                onChange={(e) => set("year", e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                required
                className={`${field} tabular-nums`}
              />
            </label>
            <label className={labelCls}>
              Duración (min)
              <input value={f.runtime} onChange={(e) => set("runtime", e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" className={`${field} tabular-nums`} />
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-ink-2">Géneros</span>
            <div className="flex flex-wrap gap-2">
              {f.genres.map((g) => (
                <span key={g} className="inline-flex h-9 items-center gap-1 rounded-full bg-pine-soft pr-1.5 pl-3.5 text-sm font-semibold text-pine">
                  {g}
                  <button
                    type="button"
                    onClick={() => set("genres", f.genres.filter((x) => x !== g))}
                    aria-label={`Quitar ${g}`}
                    className="grid size-7 place-items-center rounded-full"
                  >
                    <X className="size-3.5" strokeWidth={2.2} aria-hidden />
                  </button>
                </span>
              ))}
              <label className="inline-flex">
                <span className="sr-only">Agregar género</span>
                <select
                  value=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v && !f.genres.includes(v)) set("genres", [...f.genres, v]);
                  }}
                  className="h-9 rounded-full border border-dashed border-line bg-transparent px-3 text-sm font-semibold text-ink-2"
                >
                  <option value="">+ Género</option>
                  {GENRE_OPTIONS.filter((g) => !f.genres.includes(g)).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <label className={labelCls}>
            Sinopsis
            <textarea
              value={f.synopsis}
              onChange={(e) => set("synopsis", e.target.value)}
              rows={4}
              maxLength={5000}
              className="resize-y rounded-xl border border-line bg-field px-3.5 py-3 text-[15px] leading-relaxed text-ink"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className={labelCls}>
              <span className="inline-flex items-center gap-1.5">
                <ImdbLogo className="h-4" />
                Puntuación
              </span>
              <input value={f.imdb} onChange={(e) => set("imdb", e.target.value.replace(/[^\d.,]/g, "").slice(0, 4))} inputMode="decimal" placeholder="7,8" className={`${field} tabular-nums`} />
            </label>
            <label className={labelCls}>
              <span className="inline-flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logos/rt-fresh.svg" alt="" className="h-4 w-auto" />
                Tomatómetro (%)
              </span>
              <input value={f.rt} onChange={(e) => set("rt", e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" placeholder="85" className={`${field} tabular-nums`} />
            </label>
            <div className={labelCls}>
              <span id="cf-label">Certified Fresh</span>
              <button
                type="button"
                role="switch"
                aria-checked={f.certifiedFresh}
                aria-labelledby="cf-label"
                onClick={() => set("certifiedFresh", !f.certifiedFresh)}
                className="flex h-12 items-center justify-between rounded-xl border border-line bg-field px-3.5 text-[15px] font-medium text-ink"
              >
                {f.certifiedFresh ? "Sí" : "No"}
                <SwitchTrack on={f.certifiedFresh} />
              </button>
            </div>
          </div>
          <label className={labelCls}>
            Tráiler (enlace)
            <input type="url" value={f.trailerUrl} onChange={(e) => set("trailerUrl", e.target.value)} placeholder="https://www.youtube.com/…" className={`${field} h-11 text-[13px]`} />
          </label>
        </div>
      </section>

      <section aria-labelledby="plataformas" className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-card sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="plataformas" className="text-[19px] font-bold">
            Dónde verla en Colombia
          </h2>
          <SwitchButton on={f.noPlatform} onChange={(v) => set("noPlatform", v)} className="h-10 rounded-full pr-1.5 pl-3.5 text-sm">
            Sin plataforma
          </SwitchButton>
        </div>
        {f.noPlatform ? (
          <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-[18px] text-[15px] text-ink-2">
            <Clapperboard className="size-[22px] shrink-0" strokeWidth={1.8} aria-hidden />
            Se mostrará con la etiqueta «Sin plataforma». Pueden agregar una cuando aparezca en algún servicio.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {f.streaming.map((o, i) => (
              <div key={`${o.provider}-${i}`} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-2.5">
                <ProviderLogo src={o.logoUrl} name={o.name} className="size-11 rounded-[11px]" />
                <input
                  value={o.name}
                  onChange={(e) => updateOffer(i, { name: e.target.value })}
                  aria-label="Nombre de la plataforma"
                  className="h-10 w-[150px] flex-none rounded-[10px] border border-transparent bg-transparent px-1 text-[15px] font-semibold text-ink hover:border-line focus:border-line"
                />
                <label className="inline-flex">
                  <span className="sr-only">Tipo de acceso en {o.name}</span>
                  <select
                    value={o.type}
                    onChange={(e) => updateOffer(i, { type: e.target.value as OfferType })}
                    className="h-10 rounded-[10px] border border-line bg-field px-2.5 text-sm font-semibold text-ink"
                  >
                    {(Object.keys(OFFER_LABEL) as OfferType[]).map((t) => (
                      <option key={t} value={t}>
                        {OFFER_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex min-w-0 flex-[1_1_240px]">
                  <span className="sr-only">Enlace en {o.name}</span>
                  <input
                    type="url"
                    value={o.url}
                    onChange={(e) => updateOffer(i, { url: e.target.value })}
                    className="h-10 min-w-0 flex-1 rounded-[10px] border border-line bg-field px-3 text-[13px] text-ink-2"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => set("streaming", f.streaming.filter((_, j) => j !== i))}
                  aria-label={`Quitar ${o.name}`}
                  className="nv-press grid size-10 place-items-center rounded-[10px] text-ink-2"
                >
                  <Trash2 className="size-[18px]" strokeWidth={1.8} aria-hidden />
                </button>
              </div>
            ))}
            {!f.streaming.length && <p className="text-sm text-ink-2">Sin plataformas todavía. Agreguen una:</p>}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="mr-1 text-[13px] font-semibold text-ink-2">Agregar:</span>
              {KNOWN_PLATFORMS.map((p) => (
                <button
                  key={p.provider}
                  type="button"
                  onClick={() => addPlatform(p)}
                  aria-label={`Agregar ${p.name}`}
                  title={p.name}
                  className="nv-press grid size-11 place-items-center rounded-xl border border-dashed border-line"
                >
                  {p.logoUrl ? <ProviderLogo src={p.logoUrl} name={p.name} className="size-8 rounded-lg" /> : <Plus className="size-4 text-ink-2" aria-hidden />}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="personal" className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-card sm:p-7">
        <h2 id="personal" className="text-[19px] font-bold">
          Para ustedes
        </h2>
        <div className="flex flex-wrap gap-3">
          <SwitchButton on={f.favorite} onChange={(v) => set("favorite", v)} className="h-[52px] flex-[1_1_200px] pr-2 pl-4">
            Favorita
          </SwitchButton>
          <SwitchButton on={f.watched} onChange={(v) => set("watched", v)} className="h-[52px] flex-[1_1_200px] pr-2 pl-4">
            Ya la vimos
          </SwitchButton>
          <label className="flex h-[52px] flex-[1_1_260px] items-center gap-2.5 rounded-[14px] border border-line bg-field pr-2 pl-4 text-[15px] font-semibold text-ink">
            Día del calendario
            <select
              value={f.calendarDate}
              onChange={(e) => set("calendarDate", e.target.value)}
              className="ml-auto h-[38px] max-w-[180px] rounded-[10px] border border-line bg-surface px-2.5 text-sm font-semibold text-ink"
            >
              <option value="">Sin asignar</option>
              {days.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                  {d.taken ? " · ocupado" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={labelCls}>
          <span>¿Quién la sugirió?</span>
          <ProfileChips value={f.suggestedBy} onChange={(id) => set("suggestedBy", id)} label="¿Quién la sugirió?" />
        </div>
        <label className={labelCls}>
          Notas
          <textarea
            value={f.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Con quién verla, qué snack preparar, recuerdos…"
            className="resize-y rounded-xl border border-line bg-field px-3.5 py-3 text-[15px] leading-normal text-ink"
          />
        </label>
      </section>

      <div className="z-20 -mx-4 border-t border-line bg-glass px-4 py-3.5 backdrop-blur-xl backdrop-saturate-150 sm:mx-0 sm:rounded-2xl sm:border md:sticky md:bottom-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex-[1_1_220px] text-[13px] text-ink-2">Los datos automáticos vienen de JustWatch y se pueden editar.</span>
          <Link href={movie ? `/peliculas/${movie.id}` : "/peliculas"} className="nv-press inline-flex h-12 items-center rounded-[14px] border border-line bg-surface px-5 text-[15px] font-semibold text-ink">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="nv-press inline-flex h-12 items-center gap-2 rounded-[14px] bg-berry px-[22px] text-[15px] font-semibold text-white disabled:opacity-70"
          >
            <Check className="size-[18px]" strokeWidth={2.4} aria-hidden />
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Guardar película"}
          </button>
        </div>
      </div>
    </form>
  );
}

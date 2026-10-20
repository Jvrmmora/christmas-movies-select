"use client";
/* eslint-disable @next/next/no-img-element -- backdrop from JustWatch's CDN */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { ChevronLeft, ExternalLink, Heart, Pencil, Play, RefreshCw, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Poster, ProviderLogo } from "@/components/ui/poster";
import { ImdbLogo, RtLogo } from "@/components/ui/rating-badges";
import { CloseButton, Dialog } from "@/components/ui/dialog";
import { Credits } from "@/components/profiles/attribution";
import { WatchedButton } from "./watched";
import { usePrefs } from "@/components/providers";
import {
  deleteMovieAction,
  refreshMetadataAction,
  setFavoriteAction,
  setMyRatingAction,
  setNotesAction,
  setWatchedAction,
} from "@/actions/movies";
import { formatRuntime, formatScore, OFFER_GROUP_LABEL, OFFER_LABEL } from "@/lib/format";
import { primaryOffer } from "@/lib/platforms";
import { parseKey } from "@/lib/calendar";
import type { Movie, OfferType } from "@/lib/types";

const longDate = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" });
const shortDate = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });
const relative = new Intl.RelativeTimeFormat("es-CO", { numeric: "auto" });
const GROUPS: OfferType[] = ["flatrate", "free", "ads", "rent", "buy"];

function syncedLabel(iso: string | null) {
  if (!iso) return "sin sincronizar";
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 864e5);
  return days === 0 ? "hoy" : relative.format(days, "day");
}

export function MovieDetail({ movie, calendarDate }: { movie: Movie; calendarDate: string | null }) {
  const router = useRouter();
  const { play } = usePrefs();
  const [, startTransition] = useTransition();
  const [view, setOptimistic] = useOptimistic(
    { watched: movie.watched, favorite: movie.favorite, myRating: movie.myRating },
    (s, patch: Partial<Pick<Movie, "watched" | "favorite" | "myRating">>) => ({ ...s, ...patch }),
  );
  const [refreshing, startRefresh] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notes, setNotes] = useState(movie.notes);

  const main = primaryOffer(movie.streaming);
  const groups = GROUPS.map((type) => ({ type, items: movie.streaming.filter((o) => o.type === type) })).filter((g) => g.items.length);

  const run = (patch: Partial<Pick<Movie, "watched" | "favorite" | "myRating">>, action: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      setOptimistic(patch);
      const res = await action();
      if (!res.ok) toast.error(res.error ?? "No se pudo guardar");
    });
  };

  const toggleWatched = () => {
    const next = !view.watched;
    play(next ? "bell" : "tick");
    if (next) toast.success("Marcada como vista");
    run({ watched: next }, () => setWatchedAction(movie.id, next));
  };

  return (
    <div>
      <section aria-hidden className="relative h-[300px] overflow-hidden bg-surface-2 sm:h-[440px]">
        {movie.backdropUrl ? (
          <img src={movie.backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_30%]" />
        ) : (
          <Poster src={movie.posterUrl} title="" className="absolute inset-0 opacity-40 blur-2xl" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-[260px] bg-gradient-to-b from-[var(--scrim)] to-bg" />
      </section>

      <div className="relative mx-auto -mt-[200px] flex max-w-[1240px] flex-wrap items-start gap-10 px-4 pb-16 sm:-mt-[220px] sm:px-8">
        <aside className="flex w-full max-w-[300px] flex-[1_1_240px] flex-col gap-3 max-sm:mx-auto">
          <Poster src={movie.posterUrl} title={movie.title} eager className="aspect-[2/3] w-full rounded-[20px] shadow-[0_24px_60px_rgba(0,0,0,.28)]" />
          {main && (
            <a href={main.url} target="_blank" rel="noopener noreferrer" className="nv-press mt-2 flex h-[52px] items-center gap-2.5 rounded-[14px] bg-ink pr-4 pl-2.5 text-base font-semibold text-bg">
              <ProviderLogo src={main.logoUrl} name={main.name} className="size-[34px] rounded-[9px]" />
              <span className="flex-1 truncate">Ver en {main.name}</span>
              <ExternalLink className="size-4" strokeWidth={2} aria-hidden />
            </a>
          )}
          <WatchedButton
            watched={view.watched}
            onToggle={toggleWatched}
            className="h-[52px] w-full text-base"
            watchedLabel={movie.watchedAt && view.watched ? `Vista el ${shortDate.format(new Date(movie.watchedAt)).replace(".", "")}` : "Vista"}
          />
          <div className="grid grid-cols-2 gap-2">
            <Link href={`/peliculas/${movie.id}/editar`} className="nv-press flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface text-sm font-semibold text-ink">
              <Pencil className="size-4" strokeWidth={1.8} aria-hidden />
              Editar
            </Link>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="nv-press flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface text-sm font-semibold text-berry-ink"
            >
              <Trash2 className="size-4" strokeWidth={1.8} aria-hidden />
              Eliminar
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-7 sm:pt-[120px]">
          <div>
            <Link href="/peliculas" className="inline-flex items-center gap-1 text-sm font-semibold text-berry-ink">
              <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
              Películas
            </Link>
            <div className="mt-2.5 flex items-start gap-4">
              <h1 className="flex-1 text-4xl leading-[1.02] font-bold tracking-[-0.035em] sm:text-[52px]">{movie.title}</h1>
              <button
                type="button"
                aria-pressed={view.favorite}
                aria-label={view.favorite ? "Quitar de favoritas" : "Marcar como favorita"}
                onClick={() => {
                  const next = !view.favorite;
                  if (next) play("jingle");
                  run({ favorite: next }, () => setFavoriteAction(movie.id, next));
                }}
                className="nv-press grid size-12 shrink-0 place-items-center rounded-full border border-line bg-surface text-berry-ink"
              >
                <Heart key={String(view.favorite)} className={`size-[22px] ${view.favorite ? "nv-heart fill-current" : ""}`} strokeWidth={1.8} aria-hidden />
              </button>
            </div>
            <p className="mt-2.5 text-base text-ink-2">
              {[movie.originalTitle && movie.originalTitle !== movie.title ? movie.originalTitle : null, movie.year, formatRuntime(movie.runtimeMinutes), movie.genres.join(", ")]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <Credits movie={movie} className="mt-3" />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex flex-[1_1_200px] items-center gap-4 rounded-[20px] bg-surface px-5 py-[18px] shadow-card">
              <ImdbLogo className="h-8" />
              <div>
                <div className="text-[30px] leading-none font-bold tracking-[-0.02em]">
                  {formatScore(movie.ratings.imdb)}
                  <span className="text-base font-semibold text-ink-2">/10</span>
                </div>
                <div className="mt-1 text-[13px] text-ink-2">Puntuación del público</div>
              </div>
            </div>
            <div className="flex flex-[1_1_200px] items-center gap-4 rounded-[20px] bg-surface px-5 py-[18px] shadow-card">
              {movie.ratings.rottenTomatoes !== null ? (
                <RtLogo score={movie.ratings.rottenTomatoes} certified={movie.ratings.certifiedFresh} className="h-10" />
              ) : (
                <img src="/logos/rt-fresh.svg" alt="Rotten Tomatoes" className="h-10 w-auto opacity-40 grayscale" />
              )}
              <div>
                <div className="text-[30px] leading-none font-bold tracking-[-0.02em]">{movie.ratings.rottenTomatoes !== null ? `${movie.ratings.rottenTomatoes}%` : "—"}</div>
                <div className="mt-1 text-[13px] text-ink-2">Tomatómetro{movie.ratings.certifiedFresh ? " · Certified Fresh" : ""}</div>
              </div>
            </div>
            <div className="flex flex-[1_1_200px] flex-col justify-center gap-2 rounded-[20px] bg-gold-soft px-5 py-[18px]">
              <div className="text-[13px] font-semibold text-gold-ink">Su calificación</div>
              <div role="radiogroup" aria-label="Su calificación" className="-ml-1.5 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = (view.myRating ?? 0) >= n;
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={view.myRating === n}
                      aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                      onClick={() => {
                        const next = view.myRating === n ? null : n;
                        play("tick");
                        run({ myRating: next }, () => setMyRatingAction(movie.id, next));
                      }}
                      className={`nv-press grid size-9 place-items-center ${filled ? "text-gold" : "text-ink-2"}`}
                    >
                      <Star className={`size-[26px] ${filled ? "fill-current" : ""}`} strokeWidth={1.6} aria-hidden />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {movie.synopsis && (
            <section aria-labelledby="sinopsis" className="flex flex-col gap-2.5">
              <h2 id="sinopsis" className="text-xl font-bold">
                Sinopsis
              </h2>
              <p className="max-w-[720px] text-[17px] leading-relaxed text-ink-2">{movie.synopsis}</p>
              {movie.trailerUrl && (
                <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1.5 text-[15px] font-semibold text-berry-ink">
                  <Play className="size-4 fill-current" aria-hidden />
                  Ver tráiler
                </a>
              )}
            </section>
          )}

          <section aria-labelledby="donde" className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="donde" className="text-xl font-bold">
                Dónde ver en Colombia
              </h2>
              <button
                type="button"
                disabled={refreshing}
                onClick={() =>
                  startRefresh(async () => {
                    const res = await refreshMetadataAction(movie.id);
                    if (res.ok) {
                      toast.success("Ratings y plataformas actualizados");
                      play("jingle");
                    } else toast.error(res.error);
                  })
                }
                className="nv-press inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line bg-surface px-3 text-[13px] font-semibold text-ink-2"
              >
                <RefreshCw className={`size-[15px] ${refreshing ? "nv-spin" : ""}`} strokeWidth={2} aria-hidden />
                {refreshing ? "Actualizando…" : "Actualizar datos"}
              </button>
            </div>
            {groups.length ? (
              <div className="overflow-hidden rounded-[20px] bg-surface shadow-card">
                {groups.map((g, gi) => (
                  <div key={g.type} className={gi ? "border-t border-line" : ""}>
                    <div className="px-5 pt-3.5 pb-1.5 text-xs font-bold tracking-[0.06em] text-ink-2 uppercase">{OFFER_GROUP_LABEL[g.type]}</div>
                    {g.items.map((o) => (
                      <a
                        key={o.provider + o.type}
                        href={o.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3.5 px-5 py-2.5 text-ink transition-colors hover:bg-surface-2"
                      >
                        <ProviderLogo src={o.logoUrl} name={o.name} className="size-10 rounded-[10px]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-base font-semibold">{o.name}</span>
                          <span className="block text-[13px] text-ink-2">{OFFER_LABEL[o.type]}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-berry-ink">
                          Abrir
                          <ExternalLink className="size-[15px]" strokeWidth={2} aria-hidden />
                        </span>
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[20px] bg-surface-2 px-5 py-6 text-[15px] text-ink-2">
                Por ahora no está en ninguna plataforma en Colombia. Prueben «Actualizar datos» más adelante o agreguen un enlace desde «Editar».
              </div>
            )}
            <p className="text-xs text-ink-2">Disponibilidad según JustWatch · actualizada {syncedLabel(movie.lastSyncedAt)}</p>
          </section>

          <div className="flex flex-wrap gap-3">
            <div className="flex flex-[1_1_280px] items-center gap-3.5 rounded-[20px] bg-surface px-5 py-[18px] shadow-card">
              {calendarDate ? (
                <>
                  <span className="flex h-[52px] w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-berry-soft leading-none text-berry-ink">
                    <span className="text-xl font-bold">{parseKey(calendarDate).getDate()}</span>
                    <span className="mt-[3px] text-[10px] font-bold tracking-[0.08em] uppercase">
                      {new Intl.DateTimeFormat("es-CO", { month: "short" }).format(parseKey(calendarDate)).replace(".", "")}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-ink-2">En el calendario de adviento</div>
                    <div className="text-base font-semibold first-letter:uppercase">{longDate.format(parseKey(calendarDate))}</div>
                  </div>
                </>
              ) : (
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-ink-2">Calendario de adviento</div>
                  <div className="text-base font-semibold">Todavía sin día</div>
                </div>
              )}
              <Link href="/calendario" className="text-sm font-semibold text-berry-ink">
                {calendarDate ? "Cambiar" : "Asignar"}
              </Link>
            </div>
            <label className="flex flex-[1_1_280px] flex-col gap-1 rounded-[20px] bg-surface px-5 py-[18px] shadow-card">
              <span className="text-[13px] text-ink-2">Notas</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => {
                  if (notes.trim() === movie.notes) return;
                  startTransition(async () => {
                    const res = await setNotesAction(movie.id, notes);
                    if (!res.ok) toast.error(res.error);
                  });
                }}
                rows={2}
                maxLength={2000}
                placeholder="Con quién verla, qué snack preparar, recuerdos…"
                className="resize-y bg-transparent text-[15px] leading-normal text-ink outline-none"
              />
            </label>
          </div>
        </div>
      </div>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} labelledBy="del-title">
        <div className="nv-pop-in relative w-[min(420px,calc(100vw-32px))] rounded-3xl bg-surface p-6 shadow-[0_30px_80px_rgba(0,0,0,.45)]">
          <CloseButton onClick={() => setConfirmDelete(false)} className="absolute top-3.5 right-3.5" />
          <h2 id="del-title" className="pr-12 text-xl font-bold">
            ¿Eliminar «{movie.title}»?
          </h2>
          <p className="mt-2 text-[15px] text-ink-2">Se quita de la lista y del calendario. No se puede deshacer.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmDelete(false)} className="nv-press h-11 rounded-xl border border-line bg-surface px-4 text-[15px] font-semibold text-ink">
              Cancelar
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() =>
                startDelete(async () => {
                  const res = await deleteMovieAction(movie.id);
                  if (res.ok) {
                    toast.success(`«${movie.title}» eliminada`);
                    router.push("/peliculas");
                  } else toast.error(res.error);
                })
              }
              className="nv-press h-11 rounded-xl bg-berry px-4 text-[15px] font-semibold text-white disabled:opacity-70"
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

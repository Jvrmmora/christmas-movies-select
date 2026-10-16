"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { CloseButton, Dialog } from "@/components/ui/dialog";
import { Poster, ProviderLogo } from "@/components/ui/poster";
import { RatingBadges } from "@/components/ui/rating-badges";
import { WatchedButton } from "./watched";
import { formatRuntime } from "@/lib/format";
import { primaryOffer, subscriptionOffers } from "@/lib/platforms";
import type { Movie } from "@/lib/types";

/**
 * Full-window carousel to browse the library: swipe, arrow buttons or ← → keys.
 * The track is native scroll-snap (so touch and trackpads feel right); the
 * active movie is whichever poster is closest to the center.
 */
export function MovieGallery({
  movies,
  startAt,
  open,
  onClose,
  isWatched,
  onToggleWatched,
}: {
  movies: Movie[];
  startAt: number;
  open: boolean;
  onClose: () => void;
  isWatched: (id: string) => boolean;
  onToggleWatched: (id: string) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="gallery-title">
      {open && movies.length > 0 && (
        <GalleryBody movies={movies} startAt={Math.min(startAt, movies.length - 1)} onClose={onClose} isWatched={isWatched} onToggleWatched={onToggleWatched} />
      )}
    </Dialog>
  );
}

function GalleryBody({
  movies,
  startAt,
  onClose,
  isWatched,
  onToggleWatched,
}: {
  movies: Movie[];
  startAt: number;
  onClose: () => void;
  isWatched: (id: string) => boolean;
  onToggleWatched: (id: string) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [active, setActive] = useState(startAt);
  const movie = movies[active];

  const goTo = useCallback(
    (index: number, smooth = true) => {
      const el = track.current;
      const slide = el?.children[Math.max(0, Math.min(movies.length - 1, index))] as HTMLElement | undefined;
      if (!el || !slide) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left: slide.offsetLeft + slide.offsetWidth / 2 - el.clientWidth / 2, behavior: smooth && !reduce ? "smooth" : "auto" });
    },
    [movies.length],
  );

  // Open on the chosen movie, and keep keyboard focus inside the gallery.
  useEffect(() => {
    goTo(startAt, false);
    track.current?.parentElement?.focus();
  }, [goTo, startAt]);

  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = track.current;
      if (!el) return;
      const center = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDistance = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const c = child as HTMLElement;
        const distance = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      setActive(best);
    });
  };

  const step = (delta: number) => goTo(active + delta);
  const main = primaryOffer(movie.streaming);
  const subs = subscriptionOffers(movie.streaming).filter((o, i, all) => all.findIndex((x) => (x.logoUrl ?? x.name) === (o.logoUrl ?? o.name)) === i);
  const watched = isWatched(movie.id);

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          step(1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          step(-1);
        } else if (e.key === "Home") {
          e.preventDefault();
          goTo(0);
        } else if (e.key === "End") {
          e.preventDefault();
          goTo(movies.length - 1);
        }
      }}
      style={{ outline: "none" }}
      className="nv-pop-in relative flex h-[min(900px,calc(100dvh-16px))] w-[min(1240px,calc(100vw-16px))] flex-col overflow-hidden rounded-[28px] bg-[#0a1210] text-white shadow-[0_30px_90px_rgba(0,0,0,.6)] sm:rounded-[36px]"
    >
      <h2 id="gallery-title" className="sr-only">
        Galería de películas
      </h2>

      {/* Ambient backdrop from the active movie */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Poster src={movie.backdropUrl || movie.posterUrl} title="" className="absolute inset-0 scale-125 opacity-45 blur-3xl transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1210]/40 via-[#0a1210]/70 to-[#0a1210]" />
      </div>

      <div className="relative flex items-center justify-between px-5 pt-4 sm:px-8 sm:pt-6">
        <p className="text-sm font-semibold tabular-nums text-white/70" aria-live="polite">
          {active + 1} <span className="text-white/40">/ {movies.length}</span>
        </p>
        <p className="hidden text-xs text-white/45 sm:block">Usa ← → o desliza para ver más</p>
        <CloseButton onClick={onClose} className="bg-white/10 text-white backdrop-blur-md hover:bg-white/20" />
      </div>

      {/* Carousel */}
      <div className="relative shrink-0">
        <div
          ref={track}
          onScroll={onScroll}
          role="listbox"
          aria-label="Películas"
          className="nv-no-scrollbar flex snap-x snap-mandatory items-center gap-4 overflow-x-auto overscroll-x-contain py-5 [--h:min(38dvh,420px)] [--w:calc(var(--h)*0.6667)] sm:gap-6"
          style={{ paddingInline: "calc(50% - var(--w) / 2)" }}
        >
          {movies.map((m, i) => {
            const on = i === active;
            return (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={on}
                aria-label={`${m.title} (${m.year})`}
                tabIndex={on ? 0 : -1}
                onClick={() => goTo(i)}
                className={`relative h-[var(--h)] w-[var(--w)] shrink-0 snap-center overflow-hidden rounded-2xl transition-[transform,opacity,box-shadow] duration-300 motion-reduce:transition-none ${
                  on ? "scale-100 opacity-100 shadow-[0_24px_60px_rgba(0,0,0,.65)] ring-2 ring-white/30" : "scale-[0.8] opacity-50 hover:opacity-80"
                }`}
              >
                <Poster src={m.posterUrl} title={m.title} className="h-full w-full" imgClassName={isWatched(m.id) ? "brightness-90 saturate-[.55]" : ""} />
                {isWatched(m.id) && (
                  <span aria-hidden className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-check text-check-ink shadow-[0_2px_8px_rgba(0,0,0,.4)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.2 4.2L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => step(-1)}
          disabled={active === 0}
          aria-label="Película anterior"
          className="nv-press absolute top-1/2 left-3 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition-opacity hover:bg-black/65 disabled:pointer-events-none disabled:opacity-0 sm:left-6"
        >
          <ChevronLeft className="size-6" strokeWidth={2.2} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={active === movies.length - 1}
          aria-label="Película siguiente"
          className="nv-press absolute top-1/2 right-3 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition-opacity hover:bg-black/65 disabled:pointer-events-none disabled:opacity-0 sm:right-6"
        >
          <ChevronRight className="size-6" strokeWidth={2.2} aria-hidden />
        </button>
      </div>

      {/* Details of the centered movie */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto px-5 pt-1 pb-6 text-center sm:gap-4 sm:px-10">
        <div className="flex max-w-[760px] flex-col items-center gap-2">
          <h3 className="text-[28px] leading-[1.05] font-bold tracking-[-0.03em] sm:text-[44px]">{movie.title}</h3>
          <p className="text-sm text-white/70 sm:text-base">
            {[movie.originalTitle && movie.originalTitle !== movie.title ? movie.originalTitle : null, movie.year, formatRuntime(movie.runtimeMinutes)].filter(Boolean).join(" · ")}
          </p>
          {movie.genres.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-1.5" aria-label="Géneros">
              {movie.genres.map((g) => (
                <li key={g} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/85">
                  {g}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white/10 px-5 py-2.5 backdrop-blur-md">
          <RatingBadges ratings={movie.ratings} size="md" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {subs.length ? (
            subs.map((o) => (
              <a
                key={o.provider + o.type}
                href={o.url}
                target="_blank"
                rel="noopener noreferrer"
                className="nv-press inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 pr-3 pl-1.5 text-sm font-semibold hover:bg-white/20"
              >
                <ProviderLogo src={o.logoUrl} name={o.name} className="size-7 rounded-lg" />
                {o.name}
              </a>
            ))
          ) : (
            <span className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white/70">{movie.streaming.length ? "Solo alquiler o compra" : "Sin plataforma"}</span>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {main && (
            <a href={main.url} target="_blank" rel="noopener noreferrer" className="nv-press inline-flex h-12 items-center gap-2 rounded-[14px] bg-white pr-4 pl-2 text-[15px] font-semibold text-[#0a1210]">
              <ProviderLogo src={main.logoUrl} name={main.name} className="size-8 rounded-lg" />
              Ver en {main.name}
              <ExternalLink className="size-4" aria-hidden />
            </a>
          )}
          <WatchedButton watched={watched} onToggle={() => onToggleWatched(movie.id)} className="h-12 !border-white/25 !bg-white/10 !text-white data-[on=true]:!bg-check" />
          <Link href={`/peliculas/${movie.id}`} className="nv-press inline-flex h-12 items-center rounded-[14px] border border-white/25 px-4 text-[15px] font-semibold text-white hover:bg-white/10">
            Ver ficha completa
          </Link>
        </div>
      </div>
    </div>
  );
}

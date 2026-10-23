"use client";
/* eslint-disable @next/next/no-img-element -- backdrops come from JustWatch's CDN, already sized */

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Gift, ListPlus, Moon, Sun, Sunset } from "lucide-react";
import { Avatar } from "@/components/avatars/avatar";
import { CAST } from "@/components/avatars/cast";
import { useProfiles } from "@/components/profiles/profiles-provider";
import { useNow } from "@/components/use-now";
import { usePrefs } from "@/components/providers";
import { ChristmasCountdown } from "./christmas-countdown";
import { MovieCard } from "@/components/movies/movie-card";
import { useFavorites } from "@/components/movies/favorite";
import { useWatched, WatchedButton } from "@/components/movies/watched";
import { Poster, ProviderLogo } from "@/components/ui/poster";
import { RatingBadges } from "@/components/ui/rating-badges";
import { countdownTo, GREETING, periodFor } from "@/lib/greeting";
import { capitalize, formatRuntime } from "@/lib/format";
import { daysUntil, parseKey, toKey } from "@/lib/calendar";
import { primaryOffer } from "@/lib/platforms";
import type { CalendarState, Movie } from "@/lib/types";

const dayFmt = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "long" });
const monthShort = new Intl.DateTimeFormat("es", { month: "short" });
const startFmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "long" });

export function DashboardView({ movies, calendar }: { movies: Movie[]; calendar: CalendarState }) {
  const now = useNow();
  const { isWatched, toggle } = useWatched(movies);
  const { isFavorite, toggle: toggleFavorite } = useFavorites(movies);
  const byId = new Map(movies.map((m) => [m.id, m]));
  const todayKey = now ? toKey(now) : null;

  const watchedCount = movies.filter((m) => isWatched(m.id)).length;
  const pending = movies.filter((m) => !isWatched(m.id));
  const pendingHours = Math.round(pending.reduce((a, m) => a + (m.runtimeMinutes ?? 100), 0) / 60);

  const assigned = Object.entries(calendar.assignments)
    .filter(([k, id]) => k >= calendar.startDate && k <= calendar.endDate && byId.has(id))
    .sort(([a], [b]) => a.localeCompare(b));
  const todayMovie = todayKey ? byId.get(calendar.assignments[todayKey] ?? "") : undefined;
  const upcoming = todayKey ? assigned.filter(([k]) => k > todayKey).slice(0, 5) : [];
  // Picked once per visit so a card stays put (with its green check) after marking it watched.
  const [shortlistIds] = useState(() =>
    movies
      .filter((m) => !m.watched)
      .sort((a, b) => Number(b.favorite) - Number(a.favorite))
      .slice(0, 6)
      .map((m) => m.id),
  );
  const shortlist = shortlistIds.map((id) => byId.get(id)).filter((m): m is Movie => !!m);

  if (!movies.length) return <EmptyWelcome />;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-wrap items-stretch gap-5">
        <GreetingCard now={now} pendingCount={pending.length} hasToday={!!todayMovie} />
        <ProgressCard watched={watchedCount} total={movies.length} pending={pending.length} hours={pendingHours} season={calendar.season} />
      </section>

      {todayMovie ? (
        <TodayCard movie={todayMovie} watched={isWatched(todayMovie.id)} onToggle={() => toggle(todayMovie.id)} dateLabel={now ? dayFmt.format(now) : ""} />
      ) : (
        <CalendarNudge configured={calendar.configured} hasAssignments={assigned.length > 0} startDate={calendar.startDate} todayKey={todayKey} />
      )}

      {upcoming.length > 0 && (
        <section aria-labelledby="prox" className="flex flex-col gap-5">
          {/* Without a movie today the card above already has the way in; a second link to the same place was a repeat. */}
          <SectionHead id="prox" title="Próximos días del calendario" href="/calendario" link={todayMovie ? "Ver calendario" : undefined} />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-5 sm:grid-cols-[repeat(auto-fill,minmax(168px,1fr))]">
            {upcoming.map(([key, id]) => {
              const m = byId.get(id)!;
              const d = parseKey(key);
              const main = primaryOffer(m.streaming);
              return (
                <Link key={key} href={`/peliculas/${m.id}`} className="nv-lift flex min-w-0 flex-col gap-2.5 text-ink">
                  <div className="relative">
                    <Poster src={m.posterUrl} title={m.title} className="aspect-[2/3] rounded-2xl shadow-card" />
                    <div className="absolute top-2.5 left-2.5 rounded-[10px] bg-surface px-2.5 pt-1.5 pb-1 text-center leading-none shadow-[0_2px_10px_rgba(0,0,0,.15)]">
                      <div className="text-lg font-bold tabular-nums">{d.getDate()}</div>
                      <div className="mt-0.5 text-[10px] font-bold tracking-[0.08em] text-berry-ink uppercase">{monthShort.format(d).replace(".", "")}</div>
                    </div>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    {main && <ProviderLogo src={main.logoUrl} name={main.name} />}
                    <span className="truncate text-[15px] font-semibold">{m.title}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {shortlist.length > 0 && (
        <section aria-labelledby="lista" className="flex flex-col gap-5">
          <SectionHead id="lista" title="Para ver pronto" href="/peliculas" link="Ver todas" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-5 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(168px,1fr))]">
            {shortlist.map((m, i) => (
              <MovieCard
                key={m.id}
                movie={m}
                watched={isWatched(m.id)}
                onToggle={() => toggle(m.id)}
                favorite={isFavorite(m.id)}
                onToggleFavorite={() => toggleFavorite(m.id)}
                delay={i * 0.04}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHead({ id, title, href, link }: { id: string; title: string; href: string; link?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 id={id} className="text-[22px] font-bold tracking-[-0.02em] sm:text-[26px]">
        {title}
      </h2>
      {link && (
        <Link href={href} className="text-[15px] font-semibold text-berry-ink hover:text-berry">
          {link}
        </Link>
      )}
    </div>
  );
}

function PeriodIcon({ hour }: { hour: number }) {
  const period = periodFor(hour);
  const Icon = period === "morning" ? Sun : period === "afternoon" ? Sunset : Moon;
  return <Icon className="size-[15px] text-gold-ink" strokeWidth={1.8} aria-hidden />;
}

function GreetingCard({ now, pendingCount, hasToday }: { now: Date | null; pendingCount: number; hasToday: boolean }) {
  const { current } = useProfiles();
  const cast = CAST[current.avatar.character];
  const cd = now ? countdownTo(now) : null;
  const greeting = now ? GREETING[periodFor(now.getHours())] : " ";
  const status =
    pendingCount === 0
      ? "Ya vieron todas las películas. ¡Qué temporada!"
      : `${pendingCount} ${pendingCount === 1 ? "película pendiente" : "películas pendientes"}${hasToday ? " · la de hoy ya está lista" : ""}`;

  return (
    <div className="nv-fade relative flex min-w-0 flex-[999_1_560px] flex-col gap-6 overflow-hidden rounded-3xl bg-surface p-6 shadow-card sm:p-7">
      <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" aria-hidden className="absolute -top-7 -right-7 text-gold-soft">
        <path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M12 2l-2 2.5M12 2l2 2.5M12 22l-2-2.5M12 22l2-2.5M3.34 7l3.1.3M3.34 7l1.3 2.9M20.66 17l-3.1-.3M20.66 17l-1.3-2.9M3.34 17l3.1-.3M3.34 17l1.3-2.9M20.66 7l-3.1.3M20.66 7l-1.3 2.9" />
      </svg>
      <div className="relative flex items-center gap-3.5">
        <Link href="/perfiles" aria-label={`Eres ${current.name}. Cambiar de perfil`} title="Cambiar de perfil" className="nv-av-host nv-press shrink-0 rounded-full ring-2 ring-line transition-shadow hover:ring-gold">
          <Avatar avatar={current.avatar} size={48} animated />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(26px,3.2vw,38px)] leading-[1.08] font-bold tracking-[-0.035em]">
            {greeting}
            {now ? <span className="text-berry-ink">, {current.name}</span> : null}
          </h1>
          <p className="mt-0.5 flex min-h-5 flex-wrap items-center gap-x-1.5 text-sm text-ink-2">
            {now && <PeriodIcon hour={now.getHours()} />}
            <span>{now ? capitalize(dayFmt.format(now)) : ""}</span>
            <span aria-hidden>·</span>
            <span>{status}</span>
          </p>
        </div>
      </div>
      <div className="relative border-t border-line pt-5">
        <ChristmasCountdown parts={cd} note={`${cast.name}: «${cast.phrase}»`} />
      </div>
    </div>
  );
}

function ProgressCard({ watched, total, pending, hours, season }: { watched: number; total: number; pending: number; hours: number; season: number }) {
  const C = 2 * Math.PI * 44;
  const dash = total ? (watched / total) * C : 0;
  return (
    <div className="nv-fade flex flex-[1_1_280px] flex-col gap-4 rounded-3xl bg-surface p-6 shadow-card" style={{ animationDelay: "0.08s" }}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">Su progreso</h2>
        <span className="text-xs text-ink-2">Temporada {season}</span>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative size-[104px] shrink-0">
          <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden className="-rotate-90">
            <circle cx="52" cy="52" r="44" fill="none" strokeWidth="10" style={{ stroke: "var(--surface-2)" }} />
            <circle
              cx="52"
              cy="52"
              r="44"
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
              style={{ stroke: "var(--check)", opacity: watched ? 1 : 0, transition: "stroke-dasharray .6s cubic-bezier(.2,.8,.2,1), opacity .3s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center" role="img" aria-label={`${watched} de ${total} vistas`}>
            <div className="font-display text-[26px] leading-none font-bold tracking-[-0.03em] tabular-nums">
              {watched}
              <span className="text-sm font-semibold text-ink-2">/{total}</span>
            </div>
            <div className="mt-1 text-[11px] text-ink-2">vistas</div>
          </div>
        </div>
        <div className="grid flex-1 gap-2">
          <div className="rounded-xl bg-pine-soft px-3 py-2.5">
            <div className="text-lg leading-tight font-bold text-pine tabular-nums">{pending}</div>
            <div className="text-xs text-ink-2">pendientes</div>
          </div>
          <div className="rounded-xl bg-berry-soft px-3 py-2.5">
            <div className="text-lg leading-tight font-bold text-berry-ink tabular-nums">≈ {hours} h</div>
            <div className="text-xs text-ink-2">por ver</div>
          </div>
        </div>
      </div>
      <Link href="/resumen" className="text-sm font-semibold text-berry-ink hover:text-berry">
        Ver el resumen de la casa
      </Link>
    </div>
  );
}

function TodayCard({ movie, watched, onToggle, dateLabel }: { movie: Movie; watched: boolean; onToggle: () => void; dateLabel: string }) {
  const main = primaryOffer(movie.streaming);
  return (
    <section aria-labelledby="hoy" className="nv-fade flex flex-wrap overflow-hidden rounded-[28px] bg-surface shadow-card" style={{ animationDelay: "0.14s" }}>
      <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5 p-7 sm:p-10">
        <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.06em] text-gold-ink uppercase">
          <Gift className="size-[18px]" strokeWidth={1.8} aria-hidden />
          <span>Hoy toca · {dateLabel}</span>
        </div>
        <div className="flex items-start gap-5">
          <Poster src={movie.posterUrl} title={movie.title} eager className="h-[154px] w-[104px] shrink-0 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,.18)]" />
          <div className="flex min-w-0 flex-col gap-2.5">
            <h2 id="hoy" className="text-[28px] leading-[1.1] font-bold tracking-[-0.025em] sm:text-[34px]">
              <Link href={`/peliculas/${movie.id}`} className="hover:underline">
                {movie.title}
              </Link>
            </h2>
            <div className="text-[15px] text-ink-2">
              {[movie.year, formatRuntime(movie.runtimeMinutes), movie.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}
            </div>
            <RatingBadges ratings={movie.ratings} size="md" />
          </div>
        </div>
        {movie.synopsis && <p className="nv-clamp-3 text-base leading-relaxed text-ink-2">{movie.synopsis}</p>}
        <div className="mt-1 flex flex-wrap gap-2.5">
          {main ? (
            <a href={main.url} target="_blank" rel="noopener noreferrer" className="nv-press inline-flex h-12 items-center gap-2.5 rounded-[14px] bg-ink pr-5 pl-2 text-[15px] font-semibold text-bg">
              <ProviderLogo src={main.logoUrl} name={main.name} className="size-8 rounded-lg" />
              Ver en {main.name}
            </a>
          ) : (
            <span className="inline-flex h-12 items-center rounded-[14px] bg-surface-2 px-5 text-[15px] font-semibold text-ink-2">Sin plataforma</span>
          )}
          <WatchedButton watched={watched} onToggle={onToggle} />
        </div>
      </div>
      <div className="relative min-h-[260px] flex-[1.25_1_460px] bg-surface-2 sm:min-h-[360px]">
        {movie.backdropUrl ? (
          <img src={movie.backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Poster src={movie.posterUrl} title={movie.title} className="absolute inset-0" />
        )}
      </div>
    </section>
  );
}

/** What the inicio says when no movie is set for today: set up, not started yet, or a day left empty. */
function CalendarNudge({ configured, hasAssignments, startDate, todayKey }: { configured: boolean; hasAssignments: boolean; startDate: string; todayKey: string | null }) {
  const setUp = !configured && !hasAssignments;
  // Today falls before the calendar's first day: nothing is missing, it just hasn't started.
  const wait = !setUp && todayKey && todayKey < startDate ? daysUntil(todayKey, startDate) : null;
  const title = setUp ? "Armen su calendario de adviento" : wait !== null ? `Su calendario empieza el ${startFmt.format(parseKey(startDate))}` : "Hoy no hay película en el calendario";
  const text = setUp
    ? "Elijan desde cuándo empezar: una película por día hasta Nochebuena."
    : wait !== null
      ? `${wait === 1 ? "Falta 1 día" : `Faltan ${wait} días`}. Mientras tanto pueden acomodar las películas de cada día.`
      : "Elijan una de la lista o pongan una para hoy.";
  return (
    <section className="nv-fade flex flex-wrap items-center gap-4 rounded-[20px] bg-surface p-5 shadow-card sm:px-6" style={{ animationDelay: "0.14s" }}>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold-ink">
        <CalendarDays className="size-5" strokeWidth={1.8} aria-hidden />
      </span>
      <div className="min-w-0 flex-[1_1_260px]">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-0.5 text-sm text-ink-2">{text}</p>
      </div>
      <Link href={setUp ? "/calendario/rango" : "/calendario"} className="nv-press inline-flex h-10 items-center rounded-full bg-pine px-4 text-sm font-semibold text-white">
        {setUp ? "Empezar" : wait !== null ? "Ver calendario" : "Ir al calendario"}
      </Link>
    </section>
  );
}

function EmptyWelcome() {
  const now = useNow();
  const { play } = usePrefs();
  const { current } = useProfiles();
  return (
    <section className="nv-fade mx-auto flex max-w-2xl flex-col items-center gap-5 rounded-[28px] bg-surface px-6 py-16 text-center shadow-card">
      <h1 className="font-display text-5xl font-bold tracking-[-0.035em]">
        {now ? GREETING[periodFor(now.getHours())] : "Hola"}
        {now ? `, ${current.name}` : ""}
      </h1>
      <p className="max-w-md text-lg text-ink-2">Su lista de películas navideñas está vacía. Empiecen pegando su lista o agregando la primera.</p>
      <div className="flex flex-wrap justify-center gap-2.5">
        <Link href="/peliculas/importar" onClick={() => play("jingle")} className="nv-press inline-flex h-12 items-center gap-2 rounded-[14px] bg-berry px-5 text-[15px] font-semibold text-white">
          <ListPlus className="size-5" aria-hidden />
          Importar lista
        </Link>
        <Link href="/peliculas/nueva" className="nv-press inline-flex h-12 items-center rounded-[14px] border border-line bg-surface px-5 text-[15px] font-semibold text-ink">
          Agregar una película
        </Link>
        <Link href="/bienvenida/peliculas" className="nv-press inline-flex h-12 items-center rounded-[14px] border border-line bg-surface px-5 text-[15px] font-semibold text-ink">
          Ver clásicas para empezar
        </Link>
      </div>
    </section>
  );
}

"use client";
/* eslint-disable @next/next/no-img-element -- backdrops come from JustWatch's CDN, already sized */

import Link from "next/link";
import { useState, useTransition } from "react";
import { CalendarDays, Gift, ListPlus, Moon, Pencil, Sun, Sunset } from "lucide-react";
import { toast } from "sonner";
import { useNow } from "@/components/use-now";
import { usePrefs } from "@/components/providers";
import { MovieCard } from "@/components/movies/movie-card";
import { useWatched, WatchedButton } from "@/components/movies/watched";
import { Poster, ProviderLogo } from "@/components/ui/poster";
import { RatingBadges } from "@/components/ui/rating-badges";
import { saveDisplayNameAction } from "@/actions/settings";
import { countdownTo, GREETING, periodFor } from "@/lib/greeting";
import { capitalize, formatRuntime } from "@/lib/format";
import { parseKey, toKey } from "@/lib/calendar";
import { primaryOffer } from "@/lib/platforms";
import type { CalendarState, Movie } from "@/lib/types";

const pad = (n: number) => String(n).padStart(2, "0");
const dayFmt = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" });
const monthShort = new Intl.DateTimeFormat("es-CO", { month: "short" });

export function DashboardView({ movies, calendar, displayName }: { movies: Movie[]; calendar: CalendarState; displayName: string }) {
  const now = useNow();
  const { isWatched, toggle } = useWatched(movies);
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

  if (!movies.length) return <EmptyWelcome displayName={displayName} />;

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-wrap items-stretch gap-6">
        <GreetingCard now={now} displayName={displayName} pendingCount={pending.length} hasToday={!!todayMovie} />
        <ProgressCard watched={watchedCount} total={movies.length} pending={pending.length} hours={pendingHours} season={calendar.season} />
      </section>

      {todayMovie ? (
        <TodayCard movie={todayMovie} watched={isWatched(todayMovie.id)} onToggle={() => toggle(todayMovie.id)} dateLabel={now ? dayFmt.format(now) : ""} />
      ) : (
        <CalendarNudge hasAssignments={assigned.length > 0} />
      )}

      {upcoming.length > 0 && (
        <section aria-labelledby="prox" className="flex flex-col gap-5">
          <SectionHead id="prox" title="Próximos días del calendario" href="/calendario" link="Ver calendario" />
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
              <MovieCard key={m.id} movie={m} watched={isWatched(m.id)} onToggle={() => toggle(m.id)} delay={i * 0.04} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHead({ id, title, href, link }: { id: string; title: string; href: string; link: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 id={id} className="text-[22px] font-bold tracking-[-0.02em] sm:text-[26px]">
        {title}
      </h2>
      <Link href={href} className="text-[15px] font-semibold text-berry-ink hover:text-berry">
        {link}
      </Link>
    </div>
  );
}

function PeriodIcon({ hour }: { hour: number }) {
  const period = periodFor(hour);
  const Icon = period === "morning" ? Sun : period === "afternoon" ? Sunset : Moon;
  return <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden />;
}

function GreetingCard({ now, displayName, pendingCount, hasToday }: { now: Date | null; displayName: string; pendingCount: number; hasToday: boolean }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(displayName);
  const [saving, startSaving] = useTransition();
  const cd = now ? countdownTo(now) : null;
  const greeting = now ? GREETING[periodFor(now.getHours())] : " ";

  const save = () => {
    startSaving(async () => {
      const res = await saveDisplayNameAction(name);
      if (res.ok) setEditing(false);
      else toast.error(res.error);
    });
  };

  return (
    <div className="nv-fade relative min-w-0 flex-[999_1_560px] overflow-hidden rounded-[28px] bg-surface p-7 shadow-card sm:p-10">
      <svg width="260" height="260" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" aria-hidden className="absolute -top-12 -right-12 text-gold-soft">
        <path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M12 2l-2 2.5M12 2l2 2.5M12 22l-2-2.5M12 22l2-2.5M3.34 7l3.1.3M3.34 7l1.3 2.9M20.66 17l-3.1-.3M20.66 17l-1.3-2.9M3.34 17l3.1-.3M3.34 17l1.3-2.9M20.66 7l-3.1.3M20.66 7l-1.3 2.9" />
      </svg>
      <div className="relative flex min-h-5 items-center gap-2 text-[13px] font-semibold tracking-[0.06em] text-gold-ink uppercase">
        {now && <PeriodIcon hour={now.getHours()} />}
        <span>{now ? capitalize(dayFmt.format(now)) : ""}</span>
      </div>
      <h1 className="relative mt-4 font-serif text-[clamp(40px,5.6vw,72px)] leading-[1.02] font-semibold tracking-[-0.025em]">
        {greeting}
        {displayName && now ? <span className="text-berry-ink">, {displayName}</span> : null}
      </h1>
      {editing ? (
        <form
          className="relative mt-4 flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="sr-only" htmlFor="nv-name">
            Nombres para el saludo
          </label>
          <input
            id="nv-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Ana y Javier"
            maxLength={60}
            className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-field px-3.5 text-base text-ink"
          />
          <button type="submit" disabled={saving} className="nv-press h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-bg">
            Guardar
          </button>
        </form>
      ) : (
        <p className="relative mt-4 max-w-[520px] text-lg leading-normal text-ink-2 sm:text-[19px]">
          {pendingCount === 0
            ? "Ya vieron todas las películas de la lista. ¡Qué temporada!"
            : `Tienen ${pendingCount} ${pendingCount === 1 ? "película pendiente" : "películas pendientes"}${hasToday ? " y la de hoy ya está lista en el calendario." : "."}`}{" "}
          <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 align-middle text-sm font-semibold text-ink-2 underline-offset-2 hover:text-ink hover:underline">
            <Pencil className="size-3.5" aria-hidden />
            {displayName ? "Cambiar nombres" : "Poner sus nombres"}
          </button>
        </p>
      )}
      <div className="relative mt-9">
        <div className="mb-2.5 text-[13px] font-semibold text-ink-2">{cd?.isToday ? "¡Hoy es Nochebuena!" : "Faltan para Nochebuena"}</div>
        <div className="flex flex-wrap gap-2.5">
          {[
            { v: cd ? String(cd.days) : "—", l: "días" },
            { v: cd ? pad(cd.hours) : "—", l: "horas" },
            { v: cd ? pad(cd.minutes) : "—", l: "min" },
            { v: cd ? pad(cd.seconds) : "—", l: "seg" },
          ].map((c) => (
            <div key={c.l} className="min-w-[76px] rounded-[18px] bg-surface-2 px-4 pt-3.5 pb-3 text-center sm:min-w-[92px]">
              <div className="text-[32px] leading-none font-bold tracking-[-0.03em] tabular-nums sm:text-[38px]">{c.v}</div>
              <div className="mt-1.5 text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">{c.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressCard({ watched, total, pending, hours, season }: { watched: number; total: number; pending: number; hours: number; season: number }) {
  const C = 2 * Math.PI * 78;
  const dash = total ? (watched / total) * C : 0;
  return (
    <div className="nv-fade flex flex-[1_1_300px] flex-col items-center gap-6 rounded-[28px] bg-surface p-8 shadow-card" style={{ animationDelay: "0.08s" }}>
      <div className="flex items-center justify-between self-stretch">
        <h2 className="text-[17px] font-semibold">Su progreso</h2>
        <span className="text-[13px] text-ink-2">Temporada {season}</span>
      </div>
      <div className="relative size-[184px]">
        <svg width="184" height="184" viewBox="0 0 184 184" aria-hidden className="-rotate-90">
          <circle cx="92" cy="92" r="78" fill="none" strokeWidth="14" style={{ stroke: "var(--surface-2)" }} />
          <circle
            cx="92"
            cy="92"
            r="78"
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            style={{ stroke: "var(--check)", opacity: watched ? 1 : 0, transition: "stroke-dasharray .6s cubic-bezier(.2,.8,.2,1), opacity .3s" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" role="img" aria-label={`${watched} de ${total} vistas`}>
          <div className="text-[44px] leading-none font-bold tracking-[-0.03em] tabular-nums">
            {watched}
            <span className="text-[22px] font-semibold text-ink-2">/{total}</span>
          </div>
          <div className="mt-1.5 text-sm text-ink-2">vistas</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 self-stretch">
        <div className="rounded-2xl bg-pine-soft p-3.5">
          <div className="text-[22px] font-bold text-pine tabular-nums">{pending}</div>
          <div className="text-[13px] text-ink-2">pendientes</div>
        </div>
        <div className="rounded-2xl bg-berry-soft p-3.5">
          <div className="text-[22px] font-bold text-berry-ink tabular-nums">≈ {hours}</div>
          <div className="text-[13px] text-ink-2">horas por ver</div>
        </div>
      </div>
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

function CalendarNudge({ hasAssignments }: { hasAssignments: boolean }) {
  return (
    <section className="nv-fade flex flex-wrap items-center gap-6 rounded-[28px] bg-surface p-7 shadow-card sm:p-10" style={{ animationDelay: "0.14s" }}>
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gold-soft text-gold-ink">
        <CalendarDays className="size-7" strokeWidth={1.6} aria-hidden />
      </span>
      <div className="min-w-0 flex-[1_1_320px]">
        <h2 className="text-[22px] font-bold tracking-[-0.02em]">{hasAssignments ? "Hoy no hay película en el calendario" : "Armen su calendario de adviento"}</h2>
        <p className="mt-1 text-base text-ink-2">
          {hasAssignments
            ? "Pueden elegir una de la lista o poner una película en el día de hoy."
            : "Elijan desde qué fecha empezar y repartan las películas, una por día hasta Nochebuena."}
        </p>
      </div>
      <Link href="/calendario" className="nv-press inline-flex h-12 items-center rounded-[14px] bg-pine px-5 text-[15px] font-semibold text-white">
        Ir al calendario
      </Link>
    </section>
  );
}

function EmptyWelcome({ displayName }: { displayName: string }) {
  const now = useNow();
  const { play } = usePrefs();
  return (
    <section className="nv-fade mx-auto flex max-w-2xl flex-col items-center gap-5 rounded-[28px] bg-surface px-6 py-16 text-center shadow-card">
      <h1 className="font-serif text-5xl font-semibold tracking-[-0.025em]">
        {now ? GREETING[periodFor(now.getHours())] : "Hola"}
        {displayName ? `, ${displayName}` : ""}
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
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Clock, Heart, Share2, Star, Tv } from "lucide-react";
import { toast } from "sonner";
import { Poster, ProviderLogo } from "@/components/ui/poster";
import { profileName, ProfileAvatar, useProfiles } from "@/components/profiles/profiles-provider";
import { shareText, type HouseInsights } from "@/lib/insights";
import type { Movie } from "@/lib/types";

const hours = (minutes: number) => Math.round(minutes / 60);

export function HouseSummary({ insights, houseName }: { insights: HouseInsights; houseName: string }) {
  if (!insights.total) return <EmptySummary />;

  async function share() {
    const text = shareText(insights, houseName);
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("Resumen copiado");
      }
    } catch (e) {
      // Closing the share sheet is not an error.
      if (!(e instanceof DOMException && e.name === "AbortError")) toast.error("No se pudo compartir");
    }
  }

  const main = insights.topGenres[0];
  return (
    <div className="flex flex-col gap-6">
      <section className="nv-fade relative flex flex-col gap-5 overflow-hidden rounded-3xl bg-surface p-6 shadow-card sm:p-8">
        <p className="text-[13px] font-semibold tracking-[0.06em] text-gold-ink uppercase">Resumen · {houseName}</p>
        <div>
          <h1 className="font-display text-[clamp(32px,5vw,52px)] leading-[1.05] font-bold tracking-[-0.035em]">{insights.tone}</h1>
          {main && (
            <p className="mt-2 max-w-xl text-lg text-ink-2">
              {main.pct} % de sus películas son de {main.genre.toLowerCase()}.
            </p>
          )}
        </div>
        <button type="button" onClick={share} className="nv-press inline-flex h-11 w-fit items-center gap-2 rounded-[14px] bg-ink px-5 text-[15px] font-semibold text-bg">
          <Share2 className="size-[18px]" strokeWidth={1.8} aria-hidden />
          Compartir resumen
        </button>
      </section>

      <section aria-label="Cifras" className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
        <Stat icon={Star} tone="pine" value={`${insights.watched}/${insights.total}`} label={`vistas (${insights.watchedPct} %)`} delay={0.04} />
        <Stat icon={Clock} tone="berry" value={`${hours(insights.watchedMinutes)} h`} label="de cine navideño ya vistas" delay={0.08} />
        <Stat icon={Clock} tone="gold" value={`≈ ${hours(insights.pendingMinutes)} h`} label="por ver" delay={0.12} />
        <Stat
          icon={Tv}
          tone="pine"
          value={insights.topPlatform?.name ?? "—"}
          label={insights.topPlatform ? `plataforma principal (${insights.topPlatform.count} ${insights.topPlatform.count === 1 ? "película" : "películas"})` : "ninguna con suscripción"}
          logo={insights.topPlatform ? { src: insights.topPlatform.logoUrl, name: insights.topPlatform.name } : undefined}
          delay={0.16}
        />
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="generos" className="nv-fade flex flex-col gap-4 rounded-3xl bg-surface p-6 shadow-card" style={{ animationDelay: "0.2s" }}>
          <h2 id="generos" className="text-base font-semibold">
            Lo que más ven
          </h2>
          {insights.topGenres.length ? (
            <ul className="flex flex-col gap-3">
              {insights.topGenres.map((g) => (
                <li key={g.genre} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold">{g.genre}</span>
                    <span className="text-ink-2 tabular-nums">
                      {g.count} {g.count === 1 ? "película" : "películas"} · {g.pct} %
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-2" role="presentation">
                    <div className="h-full rounded-full bg-berry" style={{ width: `${g.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-2">Sus películas aún no tienen género. Actualicen los datos desde cada película.</p>
          )}
        </section>
        <Suggesters insights={insights} />
        <Highlights insights={insights} />
      </div>
    </div>
  );
}

const TONE_CLASS = {
  pine: "bg-pine-soft text-pine",
  berry: "bg-berry-soft text-berry-ink",
  gold: "bg-gold-soft text-gold-ink",
} as const;

function Stat({
  icon: Icon,
  tone,
  value,
  label,
  delay,
  logo,
}: {
  icon: typeof Star;
  tone: keyof typeof TONE_CLASS;
  value: string;
  label: string;
  delay: number;
  /** A service's logo instead of the icon. */
  logo?: { src?: string; name: string };
}) {
  return (
    <div className="nv-fade flex items-center gap-4 rounded-[20px] bg-surface p-5 shadow-card" style={{ animationDelay: `${delay}s` }}>
      {logo ? (
        <ProviderLogo src={logo.src} name={logo.name} className="size-11 rounded-xl" />
      ) : (
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${TONE_CLASS[tone]}`}>
          <Icon className="size-5" strokeWidth={1.8} aria-hidden />
        </span>
      )}
      <div className="min-w-0">
        <div className="truncate text-xl leading-tight font-bold tabular-nums">{value}</div>
        <div className="text-[13px] text-ink-2">{label}</div>
      </div>
    </div>
  );
}

/** People shown before "Mostrar más". */
const SUGGESTERS_SHOWN = 4;

/** Sized to its own list (self-start), not stretched to the card beside it. */
function Suggesters({ insights }: { insights: HouseInsights }) {
  const { byId } = useProfiles();
  const [expanded, setExpanded] = useState(false);
  const hidden = Math.max(0, insights.suggesters.length - SUGGESTERS_SHOWN);
  const shown = expanded ? insights.suggesters : insights.suggesters.slice(0, SUGGESTERS_SHOWN);
  return (
    <section aria-labelledby="sugiere" className="nv-fade flex flex-col gap-4 self-start rounded-3xl bg-surface p-6 shadow-card" style={{ animationDelay: "0.24s" }}>
      <h2 id="sugiere" className="text-base font-semibold">
        Quién sugiere más
      </h2>
      {shown.length ? (
        <ul className="flex flex-col gap-3">
          {shown.map((s) => (
            <li key={s.profileId} className="flex items-center gap-3">
              <ProfileAvatar id={s.profileId} size={36} />
              <span className="flex-1 truncate font-semibold">{profileName(byId, s.profileId)}</span>
              <span className="text-sm text-ink-2 tabular-nums">
                {s.count} {s.count === 1 ? "sugerida" : "sugeridas"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-2">Cuando agreguen películas, pueden marcar quién las sugirió.</p>
      )}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="nv-press inline-flex h-10 w-fit items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold text-ink"
        >
          {expanded ? "Mostrar menos" : `Mostrar más (${hidden})`}
          <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} strokeWidth={2} aria-hidden />
        </button>
      )}
    </section>
  );
}

function MovieRow({ movie, detail }: { movie: Movie; detail: string }) {
  return (
    <Link href={`/peliculas/${movie.id}`} className="nv-lift flex items-center gap-4 text-ink">
      <Poster src={movie.posterUrl} title={movie.title} className="h-[84px] w-14 shrink-0 rounded-lg shadow-card" />
      <div className="min-w-0">
        <div className="truncate text-lg font-bold">{movie.title}</div>
        <div className="text-sm text-ink-2">{detail}</div>
      </div>
    </Link>
  );
}

function BlockHead({ id, icon: Icon, tone, title, aside }: { id: string; icon: typeof Heart; tone: keyof typeof TONE_CLASS; title: string; aside?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${TONE_CLASS[tone]}`}>
        <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden />
      </span>
      <h3 id={id} className="flex-1 text-base font-semibold">
        {title}
      </h3>
      {aside && <span className="text-sm text-ink-2 tabular-nums">{aside}</span>}
    </div>
  );
}

/**
 * Two separate ideas side by side: the heart alone makes a favorite (stars only order them),
 * and the best rated is the highest stars whether or not it has a heart.
 */
function Highlights({ insights }: { insights: HouseInsights }) {
  const favorites = insights.favoriteMovies.slice(0, 3);
  const best = insights.topRated;
  return (
    <section aria-label="Favoritas y mejor calificada" className="nv-fade grid gap-6 rounded-3xl bg-surface p-6 shadow-card md:col-span-2 md:grid-cols-2 md:gap-8" style={{ animationDelay: "0.28s" }}>
      <div className="flex flex-col gap-4" role="group" aria-labelledby="fav">
        <BlockHead id="fav" icon={Heart} tone="berry" title="Las favoritas de la casa" aside={insights.favorites ? String(insights.favorites) : undefined} />
        {favorites.length ? (
          <ul className="flex flex-col gap-4">
            {favorites.map((m) => (
              <li key={m.id}>
                <MovieRow movie={m} detail={m.myRating ? `${m.year} · ${m.myRating} de 5 estrellas` : `${m.year} · sin calificar`} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-2">Toquen el corazón de una película y aparecerá aquí.</p>
        )}
      </div>
      <div className="flex flex-col gap-4 border-t border-line pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8" role="group" aria-labelledby="mejor">
        <BlockHead id="mejor" icon={Star} tone="gold" title="La mejor calificada" />
        {best ? (
          <MovieRow movie={best} detail={`${best.year} · ${best.myRating} de 5 estrellas`} />
        ) : (
          <p className="text-sm text-ink-2">Califiquen una película con estrellas y aparecerá aquí.</p>
        )}
      </div>
    </section>
  );
}

function EmptySummary() {
  return (
    <section className="nv-fade mx-auto flex max-w-2xl flex-col items-center gap-5 rounded-[28px] bg-surface px-6 py-16 text-center shadow-card">
      <h1 className="font-display text-4xl font-bold tracking-[-0.035em]">Aún no hay nada que resumir</h1>
      <p className="max-w-md text-lg text-ink-2">Agreguen unas cuantas películas y aquí verán qué tipo de casa navideña son.</p>
      <Link href="/peliculas/nueva" className="nv-press inline-flex h-12 items-center rounded-[14px] bg-berry px-5 text-[15px] font-semibold text-white">
        Agregar una película
      </Link>
    </section>
  );
}

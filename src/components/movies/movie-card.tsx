"use client";

import Link from "next/link";
import { CalendarDays, Heart } from "lucide-react";
import { Poster, ProviderLogo } from "@/components/ui/poster";
import { RatingBadges } from "@/components/ui/rating-badges";
import { WatchedToggle } from "./watched";
import { subscriptionOffers } from "@/lib/platforms";
import type { Movie } from "@/lib/types";

export function PlatformHint({ movie }: { movie: Movie }) {
  const sub = subscriptionOffers(movie.streaming);
  if (sub.length) {
    const shown = sub.filter((o, i, all) => all.findIndex((x) => (x.logoUrl ?? x.name) === (o.logoUrl ?? o.name)) === i).slice(0, 2);
    return (
      <span className="ml-auto flex items-center gap-1">
        {shown.map((o) => (
          <ProviderLogo key={o.provider + o.type} src={o.logoUrl} name={o.name} />
        ))}
      </span>
    );
  }
  return (
    <span className="ml-auto shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-ink-2">
      {movie.streaming.length ? "Alquiler" : "Sin plataforma"}
    </span>
  );
}

export function MovieCard({
  movie,
  watched,
  onToggle,
  dateLabel,
  delay = 0,
}: {
  movie: Movie;
  watched: boolean;
  onToggle: () => void;
  dateLabel?: string;
  delay?: number;
}) {
  return (
    <article className="nv-fade flex min-w-0 flex-col gap-2.5" style={{ animationDelay: `${delay}s` }}>
      <div className="nv-lift relative aspect-[2/3] overflow-hidden rounded-2xl shadow-card">
        <Link href={`/peliculas/${movie.id}`} aria-label={`Ver detalle de ${movie.title}`} className="block h-full w-full">
          <Poster
            src={movie.posterUrl}
            title={movie.title}
            className="h-full w-full"
            imgClassName={`transition-[filter] duration-500 ${watched ? "brightness-90 saturate-[.55]" : ""}`}
          />
        </Link>
        {dateLabel && (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex h-[26px] items-center gap-1.5 rounded-lg bg-black/60 px-2.5 text-xs font-semibold text-white backdrop-blur-md">
            <CalendarDays className="size-[13px]" strokeWidth={2} aria-hidden />
            {dateLabel}
          </span>
        )}
        {movie.favorite && (
          <span className="pointer-events-none absolute top-3 left-3 grid size-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md" aria-label="Favorita">
            <Heart className="size-3.5 fill-current" aria-hidden />
          </span>
        )}
        <WatchedToggle watched={watched} title={movie.title} onToggle={onToggle} />
      </div>
      <div className="min-w-0">
        <Link href={`/peliculas/${movie.id}`} className="block truncate text-[15px] font-semibold text-ink hover:underline">
          {movie.title}
        </Link>
        <div className="mt-0.5 truncate text-[13px] text-ink-2">
          {movie.year}
          {movie.genres.length ? ` · ${movie.genres.slice(0, 2).join(" · ")}` : ""}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <RatingBadges ratings={movie.ratings} />
        <PlatformHint movie={movie} />
      </div>
    </article>
  );
}

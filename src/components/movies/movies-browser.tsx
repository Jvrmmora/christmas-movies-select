"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Clapperboard, GalleryHorizontal, ListPlus, Search, TreePine } from "lucide-react";
import { MovieCard } from "./movie-card";
import { MovieGallery } from "./movie-gallery";
import { useFavorites } from "./favorite";
import { useWatched } from "./watched";
import { ProfileChips } from "@/components/profiles/profile-chips";
import { useProfiles } from "@/components/profiles/profiles-provider";
import { ProviderLogo } from "@/components/ui/poster";
import { filterKey, subscriptionOffers } from "@/lib/platforms";
import { parseKey } from "@/lib/calendar";
import type { CalendarState, Movie } from "@/lib/types";

type Status = "all" | "pending" | "watched";
type Sort = "cal" | "title" | "imdb" | "rt" | "year" | "added";

const monthShort = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });
const NONE = "__none__";

export function MoviesBrowser({ movies, calendar }: { movies: Movie[]; calendar: CalendarState }) {
  const { isWatched, toggle } = useWatched(movies);
  const { isFavorite, toggle: toggleFavorite } = useFavorites(movies);
  const [status, setStatus] = useState<Status>("all");
  const [platform, setPlatform] = useState<string>("all");
  const [genre, setGenre] = useState<string>("all");
  const [by, setBy] = useState("");
  const { profiles } = useProfiles();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("cal");
  const [galleryAt, setGalleryAt] = useState<number | null>(null);

  const dateById = useMemo(() => {
    const map = new Map<string, string>();
    for (const [key, id] of Object.entries(calendar.assignments)) {
      if (key >= calendar.startDate && key <= calendar.endDate) map.set(id, key);
    }
    return map;
  }, [calendar]);

  const platforms = useMemo(() => {
    const counts = new Map<string, { key: string; name: string; logoUrl?: string; count: number }>();
    for (const m of movies) {
      const seen = new Set<string>();
      for (const o of subscriptionOffers(m.streaming)) {
        const f = filterKey(o);
        if (seen.has(f.key)) continue;
        seen.add(f.key);
        const cur = counts.get(f.key) ?? { ...f, count: 0 };
        cur.count++;
        counts.set(f.key, cur);
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  }, [movies]);
  const noneCount = movies.filter((m) => !subscriptionOffers(m.streaming).length).length;
  const genres = useMemo(() => [...new Set(movies.flatMap((m) => m.genres))].sort((a, b) => a.localeCompare(b, "es")), [movies]);

  const watchedCount = movies.filter((m) => isWatched(m.id)).length;
  const query = q.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const list = movies
    .filter((m) => {
      const w = isWatched(m.id);
      if (status === "pending" && w) return false;
      if (status === "watched" && !w) return false;
      const subs = subscriptionOffers(m.streaming);
      if (platform === NONE && subs.length) return false;
      if (platform !== "all" && platform !== NONE && !subs.some((o) => filterKey(o).key === platform)) return false;
      if (genre !== "all" && !m.genres.includes(genre)) return false;
      if (by && (m.suggestedBy ?? m.addedBy) !== by) return false;
      if (query) {
        const hay = `${m.title} ${m.originalTitle}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
        if (!hay.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case "title":
          return a.title.localeCompare(b.title, "es");
        case "imdb":
          return (b.ratings.imdb ?? -1) - (a.ratings.imdb ?? -1);
        case "rt":
          return (b.ratings.rottenTomatoes ?? -1) - (a.ratings.rottenTomatoes ?? -1);
        case "year":
          return b.year - a.year;
        case "added":
          return b.createdAt.localeCompare(a.createdAt);
        default: {
          const da = dateById.get(a.id) ?? "9999";
          const db = dateById.get(b.id) ?? "9999";
          return da.localeCompare(db) || a.title.localeCompare(b.title, "es");
        }
      }
    });

  const clear = () => {
    setStatus("all");
    setPlatform("all");
    setGenre("all");
    setBy("");
    setQ("");
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-[1.05] font-bold tracking-[-0.03em] sm:text-[44px]">Películas</h1>
          <p className="mt-2 text-base text-ink-2">
            {movies.length} en la lista · {watchedCount} {watchedCount === 1 ? "vista" : "vistas"} · {movies.length - watchedCount} {movies.length - watchedCount === 1 ? "pendiente" : "pendientes"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGalleryAt(0)}
            disabled={!list.length}
            className="nv-press inline-flex h-11 items-center gap-2 rounded-xl bg-berry px-4 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            <GalleryHorizontal className="size-[18px]" strokeWidth={2} aria-hidden />
            Explorar en galería
          </button>
          <Link href="/peliculas/importar" className="nv-press inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[15px] font-semibold text-ink">
            <ListPlus className="size-[18px]" strokeWidth={1.8} aria-hidden />
            Importar lista
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Estado" className="flex gap-1 rounded-[14px] bg-surface-2 p-1">
            {(
              [
                ["all", "Todas"],
                ["pending", "Pendientes"],
                ["watched", "Vistas"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={status === key}
                onClick={() => setStatus(key)}
                className={`h-9 rounded-[10px] px-4 text-sm font-semibold ${status === key ? "bg-surface text-ink shadow-card" : "text-ink-2"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex h-11 min-w-0 flex-[1_1_240px] items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 text-ink-2">
            <Search className="size-[18px]" strokeWidth={1.8} aria-hidden />
            <span className="sr-only">Buscar película</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            Género
            <select value={genre} onChange={(e) => setGenre(e.target.value)} className="h-11 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink">
              <option value="all">Todos</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            Ordenar
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-11 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink">
              <option value="cal">Fecha en el calendario</option>
              <option value="title">Título</option>
              <option value="imdb">Mejor IMDb</option>
              <option value="rt">Mejor Rotten Tomatoes</option>
              <option value="year">Más recientes</option>
              <option value="added">Agregadas hace poco</option>
            </select>
          </label>
        </div>
        <div role="group" aria-label="Plataforma" className="nv-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:px-0">
          <Chip on={platform === "all"} onClick={() => setPlatform("all")} label="Todas" count={movies.length} />
          {platforms.map((p) => (
            <Chip key={p.key} on={platform === p.key} onClick={() => setPlatform(p.key)} label={p.name} count={p.count} icon={<ProviderLogo src={p.logoUrl} name={p.name} className="size-7 rounded-lg" />} />
          ))}
          <Chip
            on={platform === NONE}
            onClick={() => setPlatform(NONE)}
            label="Sin plataforma"
            count={noneCount}
            icon={
              <span className="grid size-7 place-items-center rounded-lg bg-surface-2 text-ink-2">
                <Clapperboard className="size-4" strokeWidth={1.8} aria-hidden />
              </span>
            }
          />
        </div>
        {profiles.length > 1 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-sm text-ink-2">Sugerida por</span>
            <ProfileChips value={by} onChange={setBy} label="Sugerida por" allLabel="Todos" />
          </div>
        )}
      </div>

      {list.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-5 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(176px,1fr))]">
          {list.map((m, i) => {
            const key = dateById.get(m.id);
            return (
              <MovieCard
                key={m.id}
                movie={m}
                watched={isWatched(m.id)}
                onToggle={() => toggle(m.id)}
                favorite={isFavorite(m.id)}
                onToggleFavorite={() => toggleFavorite(m.id)}
                dateLabel={key ? monthShort.format(parseKey(key)).replace(".", "") : undefined}
                delay={Math.min(i, 12) * 0.03}
                onExplore={() => setGalleryAt(i)}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[28px] bg-surface px-6 py-[72px] text-center shadow-card">
          <TreePine className="size-[72px] text-pine" strokeWidth={1.1} aria-hidden />
          <h2 className="text-[22px] font-bold">{movies.length ? "Nada por aquí" : "Todavía no hay películas"}</h2>
          <p className="max-w-[380px] text-[15px] leading-normal text-ink-2">
            {movies.length ? "Ninguna película coincide con estos filtros." : "Agreguen la primera o importen su lista completa."}
          </p>
          {movies.length ? (
            <button type="button" onClick={clear} className="nv-press mt-2 h-11 rounded-xl bg-ink px-[18px] text-[15px] font-semibold text-bg">
              Limpiar filtros
            </button>
          ) : (
            <Link href="/peliculas/importar" className="nv-press mt-2 inline-flex h-11 items-center rounded-xl bg-berry px-[18px] text-[15px] font-semibold text-white">
              Importar lista
            </Link>
          )}
        </div>
      )}
      <MovieGallery
        movies={list}
        startAt={galleryAt ?? 0}
        open={galleryAt !== null}
        onClose={() => setGalleryAt(null)}
        isWatched={isWatched}
        onToggleWatched={toggle}
      />
    </div>
  );
}

function Chip({ on, onClick, label, count, icon }: { on: boolean; onClick: () => void; label: string; count: number; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`nv-press inline-flex h-10 flex-none items-center gap-2 rounded-full border-[1.5px] text-sm font-semibold text-ink ${icon ? "pr-3.5 pl-1.5" : "px-3.5"} ${
        on ? "border-gold bg-gold-soft" : "border-line bg-surface"
      }`}
    >
      {icon}
      {label}
      <span className="text-xs text-ink-2 tabular-nums">{count}</span>
    </button>
  );
}

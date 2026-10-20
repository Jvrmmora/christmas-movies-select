"use client";

import Link from "next/link";
import { useId, useMemo, useOptimistic, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CalendarDays, Check, Clapperboard, ExternalLink, GripVertical, Play, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { saveCalendarAction } from "@/actions/calendar";
import { Credits, SuggestedBadge } from "@/components/profiles/attribution";
import { usePrefs } from "@/components/providers";
import { useNow } from "@/components/use-now";
import { useWatched, WatchedButton } from "@/components/movies/watched";
import { Poster, ProviderLogo } from "@/components/ui/poster";
import { ImdbLogo, RtLogo } from "@/components/ui/rating-badges";
import { CloseButton, Dialog } from "@/components/ui/dialog";
import { freeDays, MONTH_NAMES, monthCells, parseKey, planAutoFill, rangeDays, toKey } from "@/lib/calendar";
import { formatRuntime, formatScore, OFFER_GROUP_LABEL } from "@/lib/format";
import { primaryOffer } from "@/lib/platforms";
import type { CalendarState, Movie } from "@/lib/types";
import { CalendarToolbar } from "./calendar-toolbar";

const longFmt = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" });
const shortFmt = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long" });
const chipFmt = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });
const WEEKDAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

/** The day under the finger wins; rectangles only as a fallback (keyboard, edges). */
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

type Patch = Partial<Pick<CalendarState, "assignments" | "surprise">>;

export function AdventCalendar({ movies, calendar }: { movies: Movie[]; calendar: CalendarState }) {
  const now = useNow();
  const todayKey = now ? toKey(now) : null;
  const { play } = usePrefs();
  const { isWatched, toggle } = useWatched(movies);
  const [cal, applyOptimistic] = useOptimistic(calendar, (s, p: Patch) => ({ ...s, ...p }));
  const [, startTransition] = useTransition();
  const [month, setMonth] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [pickKey, setPickKey] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  // Stable id so dnd-kit's accessibility ids match between server and client.
  const dndId = useId();

  const byId = useMemo(() => new Map(movies.map((m) => [m.id, m])), [movies]);
  const days = useMemo(() => rangeDays(cal.startDate, cal.endDate), [cal.startDate, cal.endDate]);
  const inRange = useMemo(() => new Map(days.map((k, i) => [k, i + 1])), [days]);
  const assignedIds = new Map<string, string>();
  for (const [k, id] of Object.entries(cal.assignments)) if (inRange.has(k) && byId.has(id)) assignedIds.set(id, k);

  const pool = movies
    .filter((m) => !assignedIds.has(m.id) && !isWatched(m.id))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || (b.ratings.imdb ?? 0) - (a.ratings.imdb ?? 0));

  // Watched movies with no day in this range: not in the pool, but never hidden.
  const seenNoDay = movies.filter((m) => !assignedIds.has(m.id) && isWatched(m.id));

  const monthKeys = [...new Set(days.map((k) => k.slice(0, 7)))];
  const currentMonth =
    month && monthKeys.includes(month) ? month : todayKey && monthKeys.includes(todayKey.slice(0, 7)) ? todayKey.slice(0, 7) : monthKeys[0];
  const cells = monthCells(currentMonth, inRange);
  const assignedCount = days.filter((k) => byId.has(cal.assignments[k] ?? "")).length;
  const fromKey = todayKey && todayKey > cal.startDate ? todayKey : cal.startDate;

  const persist = (patch: Patch) => {
    startTransition(async () => {
      applyOptimistic(patch);
      const res = await saveCalendarAction(patch);
      if (!res.ok) toast.error(res.error);
    });
  };

  const withMovieAt = (key: string, movieId: string) => {
    const next = Object.fromEntries(Object.entries(cal.assignments).filter(([, id]) => id !== movieId));
    next[key] = movieId;
    return next;
  };

  const assign = (key: string, movieId: string) => {
    persist({ assignments: withMovieAt(key, movieId) });
    play("jingle");
  };

  const unassign = (key: string) => {
    const next = { ...cal.assignments };
    delete next[key];
    persist({ assignments: next });
    play("tick");
  };

  const swap = (from: string, to: string) => {
    const next = { ...cal.assignments };
    const a = next[from];
    const b = next[to];
    if (b) next[from] = b;
    else delete next[from];
    if (a) next[to] = a;
    persist({ assignments: next });
    play("jingle");
  };

  const quickAssign = (movieId: string) => {
    const [free] = freeDays(days, cal.assignments, fromKey);
    if (!free) {
      toast("No quedan días libres en el rango elegido.");
      return;
    }
    assign(free, movieId);
    setMonth(free.slice(0, 7));
    toast.success(`Lista para el ${shortFmt.format(parseKey(free))}`);
  };

  const autoFill = () => {
    if (!pool.length) {
      toast("Todas las películas pendientes ya tienen día.");
      return;
    }
    const { next, placed, left } = planAutoFill(days, cal.assignments, pool.map((m) => m.id), fromKey);
    if (!placed) {
      toast("No quedan días libres en el rango elegido.");
      return;
    }
    persist({ assignments: next });
    play("jingle");
    if (left) toast(`${placed} repartidas. ${left} no caben en este rango: elijan una fecha de inicio más temprana.`);
    else toast.success(`${placed} ${placed === 1 ? "película repartida" : "películas repartidas"}`);
  };

  const shuffle = () => {
    const keys = days.filter((k) => k >= fromKey && cal.assignments[k] && !isWatched(cal.assignments[k]));
    if (keys.length < 2) return;
    const ids = keys.map((k) => cal.assignments[k]);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const next = { ...cal.assignments };
    keys.forEach((k, i) => (next[k] = ids[i]));
    persist({ assignments: next });
    play("jingle");
  };

  const clearUpcoming = () => {
    const previous = cal.assignments;
    const next = Object.fromEntries(Object.entries(previous).filter(([k, id]) => k < fromKey || isWatched(id)));
    if (Object.keys(next).length === Object.keys(previous).length) return;
    persist({ assignments: next });
    play("tick");
    toast("Calendario vaciado desde hoy", { action: { label: "Deshacer", onClick: () => persist({ assignments: previous }) } });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  const onDragStart = (e: DragStartEvent) => setDragging(String(e.active.data.current?.movieId ?? ""));
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const movieId = e.active.data.current?.movieId as string | undefined;
    const from = e.active.data.current?.fromKey as string | undefined;
    const over = e.over?.id ? String(e.over.id) : null;
    if (!movieId || !over) return;
    if (over === "pool") {
      if (from) unassign(from);
      return;
    }
    const to = over.replace(/^drop:/, "");
    if (from === to) return;
    if (from) swap(from, to);
    else assign(to, movieId);
  };

  const openMovie = openKey ? byId.get(cal.assignments[openKey] ?? "") : undefined;
  const draggingMovie = dragging ? byId.get(dragging) : undefined;

  return (
    <DndContext id={dndId} sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <h1 className="font-display text-[clamp(28px,3.4vw,36px)] leading-[1.08] font-bold tracking-[-0.035em]">Calendario de adviento</h1>
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold tabular-nums">
            <span className="inline-flex h-8 items-center gap-2.5 rounded-full bg-surface pr-1 pl-3 shadow-card">
              {chipFmt.format(parseKey(cal.startDate)).replace(".", "")} → 24 dic · {days.length} días
              <Link href="/calendario/rango" className="inline-flex h-6 items-center rounded-full bg-surface-2 px-2.5 text-ink hover:bg-line">
                Cambiar
              </Link>
            </span>
            <span className="inline-flex h-8 items-center rounded-full bg-pine-soft px-3 text-pine">{assignedCount} con película</span>
            <span className="inline-flex h-8 items-center rounded-full bg-gold-soft px-3 text-gold-ink">{days.length - assignedCount} libres</span>
            {pool.length > 0 && (
              <span className="inline-flex h-8 items-center rounded-full bg-berry-soft px-3 text-berry-ink">
                {pool.length} {pool.length === 1 ? "película sin día" : "películas sin día"}
              </span>
            )}
            {seenNoDay.length > 0 && (
              <span className="inline-flex h-8 items-center rounded-full bg-surface-2 px-3 text-ink-2">
                {seenNoDay.length} {seenNoDay.length === 1 ? "vista sin día" : "vistas sin día"}
              </span>
            )}
          </div>
        </div>

        <CalendarToolbar
          surprise={cal.surprise}
          onToggleSurprise={() => {
            persist({ surprise: !cal.surprise });
            play("jingle");
          }}
          onAutoFill={autoFill}
          onShuffle={shuffle}
          onClear={clearUpcoming}
        />

        <div className="flex flex-wrap items-start gap-5">
          <section aria-label="Días" className="flex min-w-0 flex-[999_1_640px] flex-col gap-4 rounded-3xl bg-surface p-3 shadow-card sm:p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-berry-soft text-berry-ink">
                <CalendarDays className="size-5" strokeWidth={1.8} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg leading-tight font-bold">Su calendario</h2>
                <p className="text-[13px] text-ink-2">
                  {assignedCount} de {days.length} días con película
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="tablist" aria-label="Mes" className="flex gap-1 rounded-[14px] bg-surface-2 p-1">
                {monthKeys.map((mk) => {
                  const on = mk === currentMonth;
                  const inMonth = days.filter((k) => k.startsWith(mk));
                  const filled = inMonth.filter((k) => byId.has(cal.assignments[k] ?? "")).length;
                  return (
                    <button
                      key={mk}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setMonth(mk)}
                      className={`inline-flex h-[38px] items-center gap-2 rounded-[10px] px-3.5 text-[15px] font-semibold ${on ? "bg-surface text-ink shadow-card" : "text-ink-2"}`}
                    >
                      {MONTH_NAMES[Number(mk.slice(5, 7)) - 1]}
                      <span className="text-xs text-ink-2 tabular-nums">
                        {filled}/{inMonth.length}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div aria-hidden className="hidden flex-wrap gap-3.5 text-xs text-ink-2 sm:flex">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded ring-2 ring-gold" />
                  Hoy
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded bg-check" />
                  Vista
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded border-[1.5px] border-dashed border-ink-2" />
                  Libre
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 rounded bg-door" />
                  Sorpresa
                </span>
              </div>
            </div>
            <div aria-hidden className="grid grid-cols-7 gap-1.5 rounded-xl bg-surface-2 py-2 text-center text-[11px] font-bold tracking-[0.08em] text-ink-2 sm:gap-3 sm:text-xs">
              {WEEKDAYS.map((d) => (
                <span key={d}>
                  <span className="sm:hidden">{d[0]}</span>
                  <span className="hidden sm:inline">{d}</span>
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
              {cells.map((c) => {
                if (c.kind === "blank") return <div key={c.id} aria-hidden className="aspect-[3/4]" />;
                if (c.kind === "out")
                  return (
                    <div key={c.id} aria-hidden className="grid aspect-[3/4] place-items-center rounded-[10px] bg-surface-2/60 text-[13px] text-ink-2 opacity-60 tabular-nums sm:rounded-[14px] sm:text-[15px]">
                      {c.day}
                    </div>
                  );
                if (c.kind === "xmas")
                  return (
                    <div key={c.id} className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-[10px] bg-gold-soft p-1 text-center text-gold-ink sm:rounded-[14px]">
                      <Star className="size-5 fill-current sm:size-[26px]" aria-hidden />
                      <span className="hidden text-xs font-bold sm:block">25 · Navidad</span>
                      <span className="sr-only">25 de diciembre, Navidad</span>
                    </div>
                  );
                const movie = byId.get(cal.assignments[c.key] ?? "");
                return (
                  <Door
                    key={c.key}
                    dayKey={c.key}
                    day={c.day}
                    movie={movie}
                    watched={movie ? isWatched(movie.id) : false}
                    isToday={c.key === todayKey}
                    isPast={!!todayKey && c.key < todayKey}
                    closed={!!movie && cal.surprise && !!todayKey && c.key > todayKey}
                    onOpen={() => {
                      if (movie) {
                        setOpenKey(c.key);
                        play("jingle");
                      } else setPickKey(c.key);
                    }}
                  />
                );
              })}
            </div>
          </section>

          <Pool movies={pool} seen={seenNoDay} onQuick={quickAssign} />
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" }}>
        {draggingMovie ? (
          <Poster src={draggingMovie.posterUrl} title={draggingMovie.title} className="aspect-[2/3] w-[84px] rotate-3 rounded-xl shadow-[0_18px_40px_rgba(0,0,0,.35)]" />
        ) : null}
      </DragOverlay>

      <Dialog open={!!openMovie} onClose={() => setOpenKey(null)} labelledBy="door-title" sheet>
        {openMovie && openKey && (
          <DoorDialog
            movie={openMovie}
            dayKey={openKey}
            index={inRange.get(openKey) ?? 0}
            total={days.length}
            isToday={openKey === todayKey}
            watched={isWatched(openMovie.id)}
            onToggle={() => toggle(openMovie.id)}
            onUnassign={() => {
              unassign(openKey);
              setOpenKey(null);
            }}
            onClose={() => setOpenKey(null)}
          />
        )}
      </Dialog>

      <Dialog open={!!pickKey} onClose={() => setPickKey(null)} labelledBy="pick-title" sheet>
        {pickKey && (
          <div className="nv-pop-in relative flex w-[min(460px,100vw)] flex-col gap-3.5 rounded-t-3xl bg-surface p-6 shadow-[0_30px_80px_rgba(0,0,0,.45)] sm:rounded-3xl">
            <CloseButton onClick={() => setPickKey(null)} className="absolute top-3.5 right-3.5" />
            <h2 id="pick-title" className="pr-12 text-xl font-bold">
              ¿Qué película para el {longFmt.format(parseKey(pickKey))}?
            </h2>
            {pool.length ? (
              <div className="-mx-2 flex max-h-[min(420px,60vh)] flex-col gap-1 overflow-y-auto">
                {pool.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      assign(pickKey, m.id);
                      setPickKey(null);
                    }}
                    className="flex items-center gap-3 rounded-[14px] p-2 text-left text-ink transition-colors hover:bg-surface-2"
                  >
                    <Poster src={m.posterUrl} title={m.title} className="h-[66px] w-11 shrink-0 rounded-lg" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{m.title}</span>
                      <span className="block text-[13px] text-ink-2">
                        {m.year}
                        {primaryOffer(m.streaming) ? ` · ${primaryOffer(m.streaming)!.name}` : " · Sin plataforma"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[15px] text-ink-2">
                Todas sus películas pendientes ya tienen día.{" "}
                <Link href="/peliculas/nueva" className="font-semibold text-berry-ink">
                  Agregar otra
                </Link>
              </p>
            )}
          </div>
        )}
      </Dialog>
    </DndContext>
  );
}

function Door({
  dayKey,
  day,
  movie,
  watched,
  isToday,
  isPast,
  closed,
  onOpen,
}: {
  dayKey: string;
  day: number;
  movie?: Movie;
  watched: boolean;
  isToday: boolean;
  isPast: boolean;
  closed: boolean;
  onOpen: () => void;
}) {
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: `drop:${dayKey}` });
  const { setNodeRef: dragRef, attributes, listeners, isDragging } = useDraggable({
    id: `door:${dayKey}`,
    data: { movieId: movie?.id, fromKey: dayKey },
    disabled: !movie || closed,
  });
  const label = `${longFmt.format(parseKey(dayKey))}: ${movie ? (closed ? "sorpresa" : movie.title) : "libre, elegir película"}${isToday ? " (hoy)" : ""}`;

  return (
    <div ref={dropRef} className="relative aspect-[3/4]">
      <button
        ref={dragRef}
        type="button"
        {...attributes}
        {...listeners}
        role="button"
        aria-roledescription={movie && !closed ? "película arrastrable" : undefined}
        aria-label={label}
        onClick={onOpen}
        className={`absolute inset-0 overflow-hidden rounded-[10px] text-ink transition-[transform,box-shadow] duration-200 sm:rounded-[14px] ${
          movie ? (closed ? "bg-door" : "bg-surface-2") : "border-[1.5px] border-dashed border-line"
        } ${isOver ? "scale-[1.04] shadow-[0_0_0_3px_var(--pine),0_12px_30px_rgba(0,0,0,.18)]" : isToday ? "nv-glow" : movie ? "shadow-[0_4px_14px_rgba(0,0,0,.12)] hover:-translate-y-[3px]" : "hover:border-ink-2"} ${
          isDragging ? "opacity-40" : ""
        } ${movie && !closed ? "touch-manipulation" : ""}`}
      >
        {movie && !closed && (
          <>
            <Poster
              src={movie.posterUrl}
              title={movie.title}
              className="absolute inset-0"
              imgClassName={watched ? "brightness-90 saturate-[.55]" : isPast ? "brightness-[.8] saturate-[.7]" : ""}
            />
            <span className="absolute top-1 left-1 grid h-4 min-w-[18px] place-items-center rounded-[5px] bg-white/92 px-1 text-[10px] font-bold text-[#1C1C1E] tabular-nums sm:top-1.5 sm:left-1.5 sm:h-[26px] sm:min-w-7 sm:rounded-lg sm:px-[7px] sm:text-[13px]">
              {day}
            </span>
          </>
        )}
        {closed && (
          <>
            <span aria-hidden className="absolute inset-y-0 left-1/2 -ml-[3px] w-1.5 bg-gold opacity-90 sm:-ml-1.5 sm:w-3" />
            <span aria-hidden className="absolute inset-x-0 top-1/2 -mt-[3px] h-1.5 bg-gold opacity-90 sm:-mt-1.5 sm:h-3" />
            <span className="absolute top-1 left-1.5 font-display text-sm font-semibold text-white tabular-nums sm:top-2 sm:left-2.5 sm:text-[26px]">{day}</span>
          </>
        )}
        {!movie && (
          <>
            <span className="absolute inset-0 grid place-items-center font-display text-base font-semibold text-ink-2 tabular-nums sm:inset-auto sm:top-2 sm:left-2.5 sm:text-2xl">{day}</span>
            <span aria-hidden className="absolute top-[58%] left-1/2 hidden size-[30px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface-2 text-ink-2 sm:grid">
              <Plus className="size-4" strokeWidth={2.2} />
            </span>
          </>
        )}
        {movie && watched && !closed && (
          <span aria-hidden className="absolute right-1 bottom-1 grid size-4 place-items-center rounded-full bg-check text-check-ink shadow-[0_2px_8px_rgba(0,0,0,.3)] sm:right-1.5 sm:bottom-1.5 sm:size-7">
            <Check className="size-2.5 sm:size-4" strokeWidth={3.2} />
          </span>
        )}
      </button>
      {/* Who suggested it, hanging off the bottom edge. Hidden while the surprise door is closed: it would give the movie away. */}
      {movie && !closed && (
        <span className="pointer-events-none absolute -bottom-[5px] left-1/2 z-[1] -translate-x-1/2 sm:-bottom-2.5">
          <SuggestedBadge movie={movie} size={26} className="size-[18px] shadow-[0_1px_4px_rgba(0,0,0,.35)] ring-2 ring-surface sm:size-[26px]" />
        </span>
      )}
      {isToday && (
        <span aria-hidden className="absolute -top-2.5 left-1/2 z-[2] hidden h-5 -translate-x-1/2 place-items-center rounded-full bg-gold px-2 text-[11px] font-extrabold tracking-[0.08em] text-[#1C1C1E] sm:grid">
          HOY
        </span>
      )}
    </div>
  );
}

function PoolItem({ movie, onQuick, seen = false }: { movie: Movie; onQuick: () => void; seen?: boolean }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: `pool:${movie.id}`, data: { movieId: movie.id } });
  const main = primaryOffer(movie.streaming);
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      role="button"
      onClick={onQuick}
      aria-label={`Poner ${movie.title}${seen ? " (ya vista)" : ""} en el próximo día libre`}
      className={`flex flex-none items-center gap-3 rounded-[14px] p-2 text-left text-ink transition-colors hover:bg-surface-2 max-md:w-[78px] max-md:flex-col max-md:items-start max-md:gap-1.5 max-md:p-0 ${
        isDragging ? "opacity-40" : ""
      } touch-manipulation`}
    >
      <span className="relative shrink-0">
        <Poster src={movie.posterUrl} title={movie.title} className="h-[66px] w-11 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,.15)] max-md:h-[112px] max-md:w-[78px] max-md:rounded-[10px]" />
        {seen && (
          <span aria-hidden className="absolute -right-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full bg-check text-check-ink shadow-[0_2px_6px_rgba(0,0,0,.3)]">
            <Check className="size-3" strokeWidth={3.2} />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 max-md:w-full">
        <span className="block truncate text-[15px] font-semibold max-md:text-[11px]">{movie.title}</span>
        <span className="block text-[13px] text-ink-2 max-md:hidden">
          {movie.year}
          {movie.runtimeMinutes ? ` · ${formatRuntime(movie.runtimeMinutes)}` : ""}
        </span>
      </span>
      {main && <ProviderLogo src={main.logoUrl} name={main.name} className="size-6 rounded-md max-md:hidden" />}
      <GripVertical className="size-4 shrink-0 text-ink-2 opacity-60 max-md:hidden" aria-hidden />
    </button>
  );
}

function Pool({ movies, seen, onQuick }: { movies: Movie[]; seen: Movie[]; onQuick: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });
  return (
    <aside
      ref={setNodeRef}
      aria-labelledby="pool-title"
      className={`flex flex-col gap-3.5 border border-line bg-surface p-4 transition-shadow max-md:fixed max-md:inset-x-0 max-md:bottom-[calc(70px+env(safe-area-inset-bottom))] max-md:z-20 max-md:rounded-t-3xl max-md:shadow-[0_-10px_30px_rgba(0,0,0,.12)] md:sticky md:top-24 md:flex-[1_1_300px] md:rounded-3xl md:border-transparent md:p-5 ${
        isOver ? "shadow-[0_0_0_3px_var(--pine),var(--shadow)]" : "md:shadow-card"
      }`}
    >
      <div>
        <div className="flex items-center gap-3">
          <span className="hidden size-10 shrink-0 place-items-center rounded-xl bg-pine-soft text-pine md:grid">
            <Clapperboard className="size-5" strokeWidth={1.8} aria-hidden />
          </span>
          <h2 id="pool-title" className="text-base font-bold md:text-lg">
            Sin asignar <span className="font-semibold text-ink-2">({movies.length})</span>
          </h2>
        </div>
        <p className="mt-2 hidden text-[13px] leading-snug text-ink-2 md:block">
          Arrastren una película a un día, o tóquenla para ponerla en el próximo día libre. Para quitarla de un día, arrástrenla de vuelta aquí.
        </p>
        <p className="mt-0.5 text-xs text-ink-2 md:hidden">Toquen una para el próximo día libre o manténganla presionada para arrastrarla.</p>
      </div>
      {movies.length ? (
        <div className="nv-no-scrollbar flex gap-1 max-md:-mx-4 max-md:flex-row max-md:gap-2.5 max-md:overflow-x-auto max-md:px-4 md:max-h-[min(560px,60vh)] md:flex-col md:overflow-y-auto">
          {movies.map((m) => (
            <PoolItem key={m.id} movie={m} onQuick={() => onQuick(m.id)} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-pine-soft px-3 py-5 text-center text-sm font-semibold text-pine">Todas sus películas pendientes tienen día</div>
      )}
      {seen.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-line pt-3.5 max-md:hidden">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <span className="grid size-5 place-items-center rounded-full bg-check text-check-ink">
              <Check className="size-3" strokeWidth={3.2} aria-hidden />
            </span>
            Vistas sin día <span className="font-semibold text-ink-2">({seen.length})</span>
          </h3>
          <p className="text-xs leading-snug text-ink-2">Ya las vieron y no están en el calendario. Pueden darles un día si quieren recordarlas o volver a verlas.</p>
          <div className="flex flex-col gap-1">
            {seen.map((m) => (
              <PoolItem key={m.id} movie={m} seen onQuick={() => onQuick(m.id)} />
            ))}
          </div>
        </div>
      )}
      <Link
        href="/peliculas/nueva"
        className="nv-press hidden h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm font-semibold text-ink-2 md:flex"
      >
        <Plus className="size-4" strokeWidth={2.2} aria-hidden />
        Agregar película
      </Link>
    </aside>
  );
}

function DoorDialog({
  movie,
  dayKey,
  index,
  total,
  isToday,
  watched,
  onToggle,
  onUnassign,
  onClose,
}: {
  movie: Movie;
  dayKey: string;
  index: number;
  total: number;
  isToday: boolean;
  watched: boolean;
  onToggle: () => void;
  onUnassign: () => void;
  onClose: () => void;
}) {
  const main = primaryOffer(movie.streaming);
  const groups = (["flatrate", "free", "ads", "rent", "buy"] as const)
    .map((type) => ({ type, items: movie.streaming.filter((o) => o.type === type) }))
    .filter((g) => g.items.length);
  const date = longFmt.format(parseKey(dayKey));

  return (
    <div className="nv-flip relative flex max-h-[92dvh] w-screen flex-col overflow-y-auto rounded-t-[28px] bg-surface shadow-[0_30px_80px_rgba(0,0,0,.5)] sm:h-[min(780px,90dvh)] sm:max-h-none sm:w-[min(1120px,calc(100vw-48px))] sm:flex-row sm:overflow-hidden sm:rounded-[32px]">
      {/* Poster column, tinted with the movie's own artwork */}
      <div className="relative h-[300px] shrink-0 overflow-hidden bg-surface-2 sm:h-auto sm:w-[36%] sm:max-w-[400px]">
        <Poster src={movie.backdropUrl || movie.posterUrl} title="" className="absolute inset-0 scale-125 opacity-60 blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
        <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10">
          <Poster src={movie.posterUrl} title={movie.title} eager className="aspect-[2/3] h-[236px] shrink-0 rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,.55)] ring-1 ring-white/20 sm:h-auto sm:w-[min(100%,calc((min(780px,90dvh)-80px)*0.6667))]" />
        </div>
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col sm:overflow-y-auto">
        <div className="flex flex-col gap-6 p-6 pt-7 sm:p-10 sm:pt-11">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 pr-12">
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gold-soft px-3.5 text-xs font-bold tracking-[0.06em] text-gold-ink uppercase">
                <CalendarDays className="size-3.5" strokeWidth={2.2} aria-hidden />
                Día {index} de {total}
              </span>
              <span className="text-sm font-semibold text-ink-2 first-letter:uppercase">{date}</span>
              {isToday && <span className="inline-flex h-7 items-center rounded-full bg-gold px-3 text-[11px] font-extrabold tracking-[0.08em] text-[#1C1C1E]">HOY</span>}
            </div>
            <h2 id="door-title" className="text-[34px] leading-[1.05] font-bold tracking-[-0.03em] sm:text-[48px]">
              <Link href={`/peliculas/${movie.id}`} className="hover:underline">
                {movie.title}
              </Link>
            </h2>
            <p className="text-base text-ink-2">
              {[movie.originalTitle && movie.originalTitle !== movie.title ? movie.originalTitle : null, movie.year, formatRuntime(movie.runtimeMinutes)].filter(Boolean).join(" · ")}
            </p>
            <Credits movie={movie} />
            {movie.genres.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label="Géneros">
                {movie.genres.map((g) => (
                  <li key={g} className="rounded-full bg-pine-soft px-3 py-1 text-[13px] font-semibold text-pine">
                    {g}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3.5 rounded-2xl bg-surface-2 px-4 py-3.5">
              <ImdbLogo className="h-7" />
              <div>
                <div className="text-[26px] leading-none font-bold tracking-[-0.02em]">
                  {formatScore(movie.ratings.imdb)}
                  <span className="text-sm font-semibold text-ink-2">/10</span>
                </div>
                <div className="mt-1 text-xs text-ink-2">Público</div>
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-2xl bg-surface-2 px-4 py-3.5">
              {movie.ratings.rottenTomatoes !== null && <RtLogo score={movie.ratings.rottenTomatoes} certified={movie.ratings.certifiedFresh} className="h-9" />}
              <div>
                <div className="text-[26px] leading-none font-bold tracking-[-0.02em]">{movie.ratings.rottenTomatoes !== null ? `${movie.ratings.rottenTomatoes}%` : "—"}</div>
                <div className="mt-1 text-xs text-ink-2">{movie.ratings.certifiedFresh ? "Certified Fresh" : "Tomatómetro"}</div>
              </div>
            </div>
          </div>

          {movie.synopsis && (
            <section aria-labelledby="door-syn" className="flex flex-col gap-2">
              <h3 id="door-syn" className="text-sm font-bold tracking-[0.06em] text-ink-2 uppercase">
                Sinopsis
              </h3>
              <p className="text-base leading-relaxed sm:text-[17px]">{movie.synopsis}</p>
            </section>
          )}

          <section aria-labelledby="door-where" className="flex flex-col gap-3">
            <h3 id="door-where" className="text-sm font-bold tracking-[0.06em] text-ink-2 uppercase">
              Dónde verla en Colombia
            </h3>
            {groups.length ? (
              <div className="flex flex-col gap-3">
                {groups.map((g) => (
                  <div key={g.type} className="flex flex-wrap items-center gap-2">
                    <span className="w-full text-xs font-semibold text-ink-2 sm:w-[150px]">{OFFER_GROUP_LABEL[g.type]}</span>
                    {g.items.map((o) => (
                      <a
                        key={o.provider + o.type}
                        href={o.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nv-press inline-flex h-11 items-center gap-2.5 rounded-xl border border-line bg-surface-2 pr-3.5 pl-1.5 text-sm font-semibold text-ink hover:border-ink-2"
                      >
                        <ProviderLogo src={o.logoUrl} name={o.name} className="size-8 rounded-lg" />
                        {o.name}
                        <ExternalLink className="size-3.5 text-ink-2" aria-hidden />
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-surface-2 px-4 py-3.5 text-sm text-ink-2">Por ahora no está en ninguna plataforma en Colombia.</p>
            )}
          </section>
        </div>

        {/* Actions stay in view while the details scroll */}
        <div className="sticky bottom-0 mt-auto flex flex-wrap items-center gap-2.5 border-t border-line bg-surface/95 p-4 backdrop-blur-md sm:px-10 sm:py-5">
          {main && (
            <a href={main.url} target="_blank" rel="noopener noreferrer" className="nv-press inline-flex h-[52px] flex-[1_1_220px] items-center gap-2.5 rounded-[14px] bg-ink pr-4 pl-2 text-base font-semibold text-bg">
              <ProviderLogo src={main.logoUrl} name={main.name} className="size-9 rounded-[10px]" />
              <span className="flex-1 truncate">Ver en {main.name}</span>
              <ExternalLink className="size-4" aria-hidden />
            </a>
          )}
          <WatchedButton watched={watched} onToggle={onToggle} className="h-[52px] flex-[1_1_180px] text-base" />
          {movie.trailerUrl && (
            <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer" className="nv-press inline-flex h-[52px] items-center gap-2 rounded-[14px] border border-line px-4 text-sm font-semibold text-ink">
              <Play className="size-4 fill-current" aria-hidden />
              Tráiler
            </a>
          )}
          <button type="button" onClick={onUnassign} className="h-[52px] rounded-[14px] px-3 text-sm font-semibold text-berry-ink">
            Quitar del día
          </button>
        </div>
      </div>
      <CloseButton onClick={onClose} className="absolute top-4 right-4 z-10 bg-black/40 text-white backdrop-blur-md" />
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { saveCalendarAction } from "@/actions/calendar";
import { usePrefs } from "@/components/providers";
import { useNow } from "@/components/use-now";
import { parseKey, PRESETS, presetStart, rangeDays } from "@/lib/calendar";
import type { CalendarState, RangePreset } from "@/lib/types";

const shortFmt = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" });

/** Step 1 of the calendar: choose where the advent range starts, then save and go organise it. */
export function RangeSetup({ calendar, pendingCount }: { calendar: CalendarState; pendingCount: number }) {
  const now = useNow();
  const router = useRouter();
  const { play } = usePrefs();
  const [preset, setPreset] = useState<RangePreset>(calendar.preset);
  const [customStart, setCustomStart] = useState(calendar.preset === "custom" ? calendar.startDate : `${calendar.season}-11-15`);
  const [saving, startSaving] = useTransition();

  const startFor = (p: RangePreset) => (now ? presetStart(p, calendar.season, now, customStart) : null);
  const daysFor = (p: RangePreset) => {
    const start = startFor(p);
    return start ? rangeDays(start, calendar.endDate).length : null;
  };
  const chosenDays = daysFor(preset);
  const fit =
    chosenDays === null || pendingCount === 0
      ? null
      : chosenDays >= pendingCount
        ? "caben todas"
        : `${pendingCount - chosenDays} ${pendingCount - chosenDays === 1 ? "queda" : "quedan"} sin día`;

  const save = () => {
    const startDate = startFor(preset);
    if (!startDate) return;
    startSaving(async () => {
      const res = await saveCalendarAction({ preset, startDate, configured: true });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      play("jingle");
      router.push("/calendario");
    });
  };

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-7">
      <div className="flex flex-col gap-3.5">
        <ol aria-label="Pasos" className="flex items-center gap-2.5 text-[13px] font-semibold">
          <li aria-current="step" className="flex items-center gap-2 text-ink">
            <span className="grid size-[22px] place-items-center rounded-full bg-berry text-xs text-white">1</span>
            Rango
          </li>
          <li aria-hidden className="h-px w-7 bg-line" />
          <li className="flex items-center gap-2 text-ink-2">
            <span className="grid size-[22px] place-items-center rounded-full bg-surface-2 text-xs">2</span>
            Organizar
          </li>
        </ol>
        <h1 className="font-display text-[clamp(30px,4vw,40px)] leading-[1.08] font-bold tracking-[-0.035em]">¿Desde cuándo empiezan?</h1>
        <p className="text-base text-pretty text-ink-2">Una película por día hasta Nochebuena. Pueden cambiarlo después.</p>
      </div>

      <fieldset className="grid grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-3">
        <legend className="sr-only">Inicio del calendario</legend>
        {PRESETS.map((p) => {
          const start = startFor(p.key);
          const days = daysFor(p.key);
          return (
            <label
              key={p.key}
              className="nv-press flex min-h-[132px] cursor-pointer flex-col gap-3.5 rounded-[18px] border-[1.5px] border-line bg-surface p-[18px] shadow-card transition-[border-color,box-shadow] has-checked:border-berry has-checked:shadow-[0_0_0_4px_var(--berry-soft)] has-focus-visible:outline-[2.5px] has-focus-visible:outline-offset-2 has-focus-visible:outline-gold"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-base font-semibold">{p.label}</span>
                <input
                  type="radio"
                  name="preset"
                  value={p.key}
                  checked={preset === p.key}
                  onChange={() => setPreset(p.key)}
                  className="size-5 accent-[var(--berry)]"
                />
              </span>
              <span className="mt-auto flex flex-col gap-0.5">
                <span className="font-display text-[28px] leading-none font-bold tracking-[-0.03em] tabular-nums">{days === null ? "—" : `${days} ${days === 1 ? "día" : "días"}`}</span>
                <span className="text-[13px] text-ink-2">{start ? `${shortFmt.format(parseKey(start)).replace(".", "")} → 24 dic` : " "}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {preset === "custom" && (
        <div className="nv-fade flex flex-wrap items-center gap-3 rounded-2xl bg-surface px-[18px] py-4 shadow-card">
          <label htmlFor="range-start" className="text-sm font-semibold">
            Empezar el
          </label>
          <input
            id="range-start"
            type="date"
            value={customStart}
            min={`${calendar.season}-10-01`}
            max={calendar.endDate}
            onChange={(e) => e.target.value && setCustomStart(e.target.value)}
            className="h-10 rounded-[10px] border border-line bg-field px-2.5 text-ink"
          />
          <span className="text-sm text-ink-2">hasta el 24 de diciembre</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] bg-surface-2 px-5 py-[18px]">
        <p className="text-[15px]">
          <strong className="font-semibold">{chosenDays === null ? "—" : `${chosenDays} días`}</strong>
          <span className="text-ink-2">
            {" · "}
            {pendingCount} {pendingCount === 1 ? "película pendiente" : "películas pendientes"}
            {fit ? ` · ${fit}` : ""}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {calendar.configured && (
            <Link href="/calendario" className="nv-press inline-flex h-12 items-center rounded-[14px] px-4 text-[15px] font-semibold text-ink-2 hover:text-ink">
              Cancelar
            </Link>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving || !now}
            className="nv-press inline-flex h-12 items-center gap-2 rounded-[14px] bg-berry px-[22px] text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Guardando…" : calendar.configured ? "Guardar rango" : "Guardar y armar calendario"}
            <ArrowRight className="size-[17px]" strokeWidth={2.2} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { CircleHelp, Gift, Shuffle, Sparkles, Trash2, WandSparkles, type LucideIcon } from "lucide-react";
import { SwitchTrack } from "@/components/ui/switch";

const toolBase = "nv-press inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold";
const tool = `${toolBase} border-line bg-surface text-ink`;
const toolPrimary = `${toolBase} border-transparent bg-pine text-white`;

/** What each tool does, in the order they appear; the «?» button opens this list. */
const HELP: { icon: LucideIcon; name: string; text: string }[] = [
  { icon: Gift, name: "Modo sorpresa", text: "Los días que aún no llegan quedan cerrados, como regalos: no se ve qué película toca hasta ese día." },
  {
    icon: WandSparkles,
    name: "Repartir automáticamente",
    text: "Pone las películas pendientes que no tienen día en los días libres, empezando hoy: primero las favoritas y luego las de mejor IMDb.",
  },
  {
    icon: Sparkles,
    name: "Repartir con inteligencia",
    text: "Lo mismo, pero eligiendo qué va en cada día: las largas, sábado y domingo; las cortas, entre semana; las mejor calificadas, hacia el final; sin repetir género dos días seguidos. Nochebuena queda libre para elegirla ustedes. Se puede deshacer.",
  },
  { icon: Shuffle, name: "Mezclar", text: "Cambia al azar el orden de las películas de hoy en adelante que todavía no han visto. Se puede deshacer." },
  { icon: Trash2, name: "Vaciar", text: "Quita las películas de hoy en adelante; las que ya vieron se quedan. Se puede deshacer." },
];

/** Step 2's tools: surprise mode plus the bulk actions over the chosen range. */
export function CalendarToolbar({
  surprise,
  onToggleSurprise,
  onAutoFill,
  onSmartFill,
  onShuffle,
  onClear,
}: {
  surprise: boolean;
  onToggleSurprise: () => void;
  onAutoFill: () => void;
  onSmartFill: () => void;
  onShuffle: () => void;
  onClear: () => void;
}) {
  const [help, setHelp] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div role="toolbar" aria-label="Herramientas del calendario" className="flex flex-wrap items-center gap-2 rounded-[18px] bg-surface p-2.5 shadow-card">
        <button
          type="button"
          role="switch"
          aria-checked={surprise}
          onClick={onToggleSurprise}
          className="inline-flex h-10 items-center gap-2.5 rounded-full border border-line bg-surface pr-1.5 pl-3.5 text-sm font-semibold text-ink"
        >
          <Gift className="size-[17px]" strokeWidth={1.8} aria-hidden />
          Modo sorpresa
          <SwitchTrack on={surprise} />
        </button>
        <span aria-hidden className="mx-1 h-6 w-px bg-line max-sm:hidden" />
        <button type="button" onClick={onAutoFill} className={toolPrimary}>
          <WandSparkles className="size-[17px]" strokeWidth={1.8} aria-hidden />
          Repartir automáticamente
        </button>
        <button type="button" onClick={onSmartFill} className={tool}>
          <Sparkles className="size-[17px]" strokeWidth={1.8} aria-hidden />
          Repartir con inteligencia
        </button>
        <button type="button" onClick={onShuffle} className={tool}>
          <Shuffle className="size-[17px]" strokeWidth={1.8} aria-hidden />
          Mezclar
        </button>
        <button
          type="button"
          onClick={() => setHelp((h) => !h)}
          aria-expanded={help}
          aria-controls="calendar-help"
          aria-label="¿Qué hace cada botón?"
          title="¿Qué hace cada botón?"
          className={`nv-press grid size-10 place-items-center rounded-full border border-line ${help ? "bg-gold-soft text-gold-ink" : "bg-surface text-ink-2"}`}
        >
          <CircleHelp className="size-[18px]" strokeWidth={1.8} aria-hidden />
        </button>
        <button type="button" onClick={onClear} className={`${toolBase} border-line bg-surface text-berry-ink sm:ml-auto`}>
          <Trash2 className="size-[17px]" strokeWidth={1.8} aria-hidden />
          Vaciar
        </button>
      </div>
      {help && (
        <dl id="calendar-help" className="nv-fade flex flex-col gap-3.5 rounded-[18px] bg-surface p-4 shadow-card sm:p-5">
          {HELP.map(({ icon: Icon, name, text }) => (
            <div key={name} className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-2">
                <Icon className="size-[17px]" strokeWidth={1.8} aria-hidden />
              </span>
              <div className="min-w-0">
                <dt className="text-sm font-semibold">{name}</dt>
                <dd className="mt-0.5 text-sm text-ink-2">{text}</dd>
              </div>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

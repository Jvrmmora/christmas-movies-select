"use client";

import { Gift, Shuffle, Trash2, WandSparkles } from "lucide-react";
import { SwitchTrack } from "@/components/ui/switch";

const toolBase = "nv-press inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold";
const tool = `${toolBase} border-line bg-surface text-ink`;
const toolPrimary = `${toolBase} border-transparent bg-pine text-white`;

/** Step 2's tools: surprise mode plus the bulk actions over the chosen range. */
export function CalendarToolbar({
  surprise,
  onToggleSurprise,
  onAutoFill,
  onShuffle,
  onClear,
}: {
  surprise: boolean;
  onToggleSurprise: () => void;
  onAutoFill: () => void;
  onShuffle: () => void;
  onClear: () => void;
}) {
  return (
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
      <button type="button" onClick={onShuffle} className={tool}>
        <Shuffle className="size-[17px]" strokeWidth={1.8} aria-hidden />
        Mezclar
      </button>
      <button type="button" onClick={onClear} className={`${toolBase} border-line bg-surface text-berry-ink sm:ml-auto`}>
        <Trash2 className="size-[17px]" strokeWidth={1.8} aria-hidden />
        Vaciar
      </button>
    </div>
  );
}

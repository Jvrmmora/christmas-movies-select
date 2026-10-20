"use client";

import { Avatar } from "@/components/avatars/avatar";
import { useProfiles } from "./profiles-provider";

const chip = "nv-press flex h-11 items-center gap-2 rounded-full border pr-4 pl-1.5 text-[15px] font-semibold transition-colors";

/** One-of-many selector made of avatars. With `allLabel` the first chip means "everyone" (value ""). */
export function ProfileChips({ value, onChange, label, allLabel }: { value: string; onChange: (id: string) => void; label: string; allLabel?: string }) {
  const { profiles } = useProfiles();
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {allLabel && (
        <button
          type="button"
          role="radio"
          aria-checked={value === ""}
          onClick={() => onChange("")}
          className={`${chip} pl-4 ${value === "" ? "border-gold bg-gold-soft text-ink" : "border-line bg-surface text-ink-2"}`}
        >
          {allLabel}
        </button>
      )}
      {profiles.map((p) => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(p.id)}
            className={`${chip} ${active ? "border-gold bg-gold-soft text-ink" : "border-line bg-surface text-ink-2"}`}
          >
            <Avatar avatar={p.avatar} size={32} />
            {p.name}
          </button>
        );
      })}
    </div>
  );
}

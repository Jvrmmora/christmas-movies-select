"use client";

import type { ReactNode } from "react";

export function SwitchTrack({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-[26px] w-11 shrink-0 rounded-full p-[3px] transition-colors ${on ? "justify-end bg-check" : "justify-start bg-surface-2"}`}
    >
      <span className="size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.3)]" />
    </span>
  );
}

export function SwitchButton({
  on,
  onChange,
  children,
  className = "",
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`flex items-center justify-between gap-3 rounded-[14px] border border-line bg-field text-[15px] font-semibold text-ink ${className}`}
    >
      {children}
      <SwitchTrack on={on} />
    </button>
  );
}

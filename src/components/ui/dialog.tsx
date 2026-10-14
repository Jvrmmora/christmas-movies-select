"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/** Native <dialog>: focus trap, Esc and top-layer for free. */
export function Dialog({
  open,
  onClose,
  labelledBy,
  children,
  sheet = false,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  /** Bottom sheet on phones. */
  sheet?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`nv-dialog ${sheet ? "nv-sheet" : ""} ${className}`}
    >
      {open ? children : null}
    </dialog>
  );
}

export function CloseButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Cerrar"
      className={`nv-press grid size-10 place-items-center rounded-full bg-surface-2 text-ink ${className}`}
    >
      <X className="size-[18px]" strokeWidth={2.2} aria-hidden />
    </button>
  );
}

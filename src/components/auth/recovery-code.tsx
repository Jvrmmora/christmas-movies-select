"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";

/** Shown once after creating a home or resetting a password: the only moment the code exists in clear. */
export function RecoveryCode({ code, continueHref = "/perfiles", continueLabel = "Continuar" }: { code: string; continueHref?: string; continueLabel?: string }) {
  const [saved, setSaved] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Código copiado");
    } catch {
      toast.error("No se pudo copiar; anótalo a mano");
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="rounded-[18px] border border-gold/50 bg-gold-soft p-5">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-gold-ink">
          <KeyRound className="size-4" strokeWidth={2} aria-hidden />
          Código de recuperación
        </p>
        <p className="mt-3 text-center font-mono text-[22px] font-semibold tracking-[0.08em] break-all select-all">{code}</p>
        <button type="button" onClick={copy} className="nv-press mx-auto mt-3 flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold">
          <Copy className="size-4" strokeWidth={1.9} aria-hidden />
          Copiar
        </button>
      </div>
      <p className="text-sm text-ink-2">
        Guárdalo en un lugar seguro. Es la única forma de recuperar la casa si olvidan la clave, y <strong className="text-ink">no se vuelve a mostrar</strong>.
      </p>
      <label className="flex items-start gap-3 text-sm font-medium">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-0.5 size-5 accent-[var(--berry)]" />
        Ya lo guardé
      </label>
      {saved ? (
        <Link href={continueHref} className="nv-press grid h-[52px] place-items-center rounded-[14px] bg-berry text-base font-semibold text-white">
          {continueLabel}
        </Link>
      ) : (
        <button type="button" disabled className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-berry text-base font-semibold text-white opacity-50">
          <Check className="size-[18px]" strokeWidth={2} aria-hidden />
          {continueLabel}
        </button>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Copy, House, KeyRound } from "lucide-react";
import { toast } from "sonner";

const SLUG_KEY = "nv-home-slug";

async function copy(text: string, ok: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(ok);
  } catch {
    toast.error("No se pudo copiar; anótalo a mano");
  }
}

/**
 * Shown once after creating a home or resetting a password: the only moment the recovery code exists in clear.
 * After sign-up it also shows the home's code, which is what the family types to sign in.
 */
export function RecoveryCode({
  code,
  homeSlug,
  continueHref = "/perfiles",
  continueLabel = "Continuar",
}: {
  code: string;
  homeSlug?: string;
  continueHref?: string;
  continueLabel?: string;
}) {
  const [saved, setSaved] = useState(false);

  // Same memory as the sign-in form: next time on this device only the password is needed.
  useEffect(() => {
    if (!homeSlug) return;
    try {
      localStorage.setItem(SLUG_KEY, homeSlug);
    } catch {
      /* storage can be blocked */
    }
  }, [homeSlug]);

  return (
    <div className="mt-7 flex flex-col gap-4">
      {homeSlug && (
        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-line bg-surface px-4 py-3.5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-ink-2">
              <House className="size-4" strokeWidth={2} aria-hidden />
              Código para entrar
            </p>
            <p className="mt-1 truncate font-mono text-lg font-semibold select-all">{homeSlug}</p>
          </div>
          <button type="button" onClick={() => copy(homeSlug, "Código de la casa copiado")} className="nv-press flex h-10 shrink-0 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold">
            <Copy className="size-4" strokeWidth={1.9} aria-hidden />
            Copiar
          </button>
        </div>
      )}
      <div className="rounded-[18px] border border-gold/50 bg-gold-soft p-5">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-gold-ink">
          <KeyRound className="size-4" strokeWidth={2} aria-hidden />
          Código de recuperación
        </p>
        <p className="mt-3 text-center font-mono text-[22px] font-semibold tracking-[0.08em] break-all select-all">{code}</p>
        <button type="button" onClick={() => copy(code, "Código copiado")} className="nv-press mx-auto mt-3 flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold">
          <Copy className="size-4" strokeWidth={1.9} aria-hidden />
          Copiar
        </button>
      </div>
      <p className="text-sm text-ink-2">
        Guárdenlo en un lugar seguro. Es la única forma de recuperar la casa si olvidan la clave, y <strong className="text-ink">no se vuelve a mostrar</strong>.
      </p>
      <label className="flex items-start gap-3 text-sm font-medium">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-0.5 size-5 accent-[var(--berry)]" />
        {homeSlug ? "Ya los guardé" : "Ya lo guardé"}
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

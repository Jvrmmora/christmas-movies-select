"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { House, LockKeyhole } from "lucide-react";
import { loginAction, type LoginState } from "@/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/auth/fields";

const SLUG_KEY = "nv-home-slug";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const form = useRef<HTMLFormElement>(null);

  // Remember the home's code on this device so next time only the password is needed.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SLUG_KEY);
      const slug = form.current?.elements.namedItem("slug") as HTMLInputElement | null;
      if (saved && slug && !slug.value) {
        slug.value = saved;
        (form.current?.elements.namedItem("password") as HTMLInputElement | null)?.focus();
      }
    } catch {
      /* storage can be blocked; the field just starts empty */
    }
  }, []);

  return (
    <form
      ref={form}
      action={action}
      onSubmit={(e) => {
        try {
          const slug = (e.currentTarget.elements.namedItem("slug") as HTMLInputElement).value.trim().toLowerCase();
          if (slug) localStorage.setItem(SLUG_KEY, slug);
        } catch {
          /* ignore */
        }
      }}
      className="mt-7 flex flex-col gap-4"
    >
      <input type="hidden" name="next" value={next} />
      <Field
        id="slug"
        label="Código de la casa"
        icon={House}
        type="text"
        required
        autoFocus
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="username"
        placeholder="casa-montano"
      />
      <Field id="password" label="Clave" icon={LockKeyhole} type="password" required autoComplete="current-password" placeholder="Su clave" />
      <Link href="/recuperar" className="-mt-2 self-end text-[13px] font-semibold text-gold-ink underline-offset-4 hover:underline">
        ¿Olvidaron la clave?
      </Link>
      <FormError>{state.error}</FormError>
      <SubmitButton pending={pending} idle="Entrar" busy="Entrando…" />
      <div className="flex items-center gap-3 text-[13px] text-ink-2">
        <span className="h-px flex-1 bg-line" />
        ¿Primera vez?
        <span className="h-px flex-1 bg-line" />
      </div>
      <Link href="/unirse" className="nv-press grid h-[52px] place-items-center rounded-[14px] border border-line text-base font-semibold text-ink hover:bg-surface">
        Crear una casa nueva
      </Link>
    </form>
  );
}

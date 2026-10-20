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
      className="mt-8 flex flex-col gap-4"
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
      <Field id="password" label="Clave" icon={LockKeyhole} type="password" required autoComplete="current-password" />
      <FormError>{state.error}</FormError>
      <SubmitButton pending={pending} idle="Entrar" busy="Entrando…" />
      <div className="mt-1 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
        <Link href="/unirse" className="font-medium text-berry-ink underline-offset-4 hover:underline">
          Crear mi casa con una invitación
        </Link>
        <Link href="/recuperar" className="text-ink-2 underline-offset-4 hover:underline">
          Olvidé la clave
        </Link>
      </div>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { loginAction, type LoginState } from "@/actions/auth";
import { Field, FormError, SubmitButton } from "@/components/auth/fields";

export function LoginForm({ next, invite }: { next: string; invite?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={action} className="mt-7 flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      {invite && <input type="hidden" name="codigo" value={invite} />}
      <Field
        id="email"
        label="Correo"
        icon={Mail}
        type="email"
        required
        autoFocus
        maxLength={254}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="username"
        placeholder="tu@correo.com"
      />
      <Field id="password" label="Clave" icon={LockKeyhole} type="password" required autoComplete="current-password" placeholder="Tu clave" />
      <Link href="/recuperar" className="-mt-2 self-end text-[13px] font-semibold text-gold-ink underline-offset-4 hover:underline">
        ¿Olvidaste la clave?
      </Link>
      <FormError>{state.error}</FormError>
      <SubmitButton pending={pending} idle="Entrar" busy="Entrando…" />
      <div className="flex items-center gap-3 text-[13px] text-ink-2">
        <span className="h-px flex-1 bg-line" />
        ¿Primera vez?
        <span className="h-px flex-1 bg-line" />
      </div>
      <Link
        href={invite ? `/unirse/${invite}` : "/unirse"}
        className="nv-press grid h-[52px] place-items-center rounded-[14px] border border-line text-base font-semibold text-ink hover:bg-surface"
      >
        Crear una cuenta
      </Link>
    </form>
  );
}

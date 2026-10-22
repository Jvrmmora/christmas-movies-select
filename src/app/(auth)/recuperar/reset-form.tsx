"use client";

import Link from "next/link";
import { useActionState } from "react";
import { KeyRound, LockKeyhole, Mail } from "lucide-react";
import { requestResetAction, resetPasswordAction, type ResetState } from "@/actions/reset";
import { Field, FormError, SubmitButton } from "@/components/auth/fields";

export function ResetForm() {
  const [asked, ask, asking] = useActionState<ResetState, FormData>(requestResetAction, {});
  const [reset, change, changing] = useActionState<ResetState, FormData>(resetPasswordAction, {});
  const email = reset.email ?? asked.email;

  if (!email) {
    return (
      <form action={ask} className="mt-8 flex flex-col gap-4">
        <Field
          id="email"
          label="Correo de la casa"
          icon={Mail}
          type="email"
          required
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="email"
          placeholder="familia@correo.com"
        />
        <FormError>{asked.error}</FormError>
        <SubmitButton pending={asking} idle="Enviar código" busy="Enviando…" />
        <Links />
      </form>
    );
  }

  return (
    <form action={change} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />
      <p className="text-sm text-ink-2">
        Si <strong className="text-ink">{email}</strong> está registrado, le enviamos un código de 6 números. Vence en 15 minutos.
      </p>
      <Field
        id="code"
        label="Código del correo"
        icon={KeyRound}
        type="text"
        inputMode="numeric"
        required
        autoFocus
        maxLength={7}
        autoComplete="one-time-code"
        placeholder="123456"
      />
      <Field id="password" label="Clave nueva" icon={LockKeyhole} type="password" required minLength={6} autoComplete="new-password" hint="Mínimo 6 caracteres." />
      <FormError>{reset.error}</FormError>
      <SubmitButton pending={changing} idle="Cambiar la clave" busy="Cambiando…" />
      <Links />
    </form>
  );
}

function Links() {
  return (
    <div className="flex flex-col gap-1.5 text-center text-sm text-ink-2">
      <Link href="/login" className="font-medium text-berry-ink underline-offset-4 hover:underline">
        Volver a entrar
      </Link>
      <Link href="/recuperar/codigo" className="underline-offset-4 hover:underline">
        Mi casa no tiene correo: usar el código de recuperación
      </Link>
    </div>
  );
}

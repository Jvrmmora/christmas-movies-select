"use client";

import Link from "next/link";
import { useActionState } from "react";
import { House, KeyRound, LockKeyhole } from "lucide-react";
import { recoverAccessAction, type HomeFormState } from "@/actions/home";
import { Field, FormError, SubmitButton } from "@/components/auth/fields";
import { RecoveryCode } from "@/components/auth/recovery-code";

export function RecoverForm() {
  const [state, action, pending] = useActionState<HomeFormState, FormData>(recoverAccessAction, {});

  if (state.recoveryCode) {
    return (
      <>
        <p className="mt-6 text-sm font-medium text-pine">¡Listo! Ya tienes clave nueva. Este es tu nuevo código de recuperación; el anterior ya no sirve.</p>
        <RecoveryCode code={state.recoveryCode} continueHref="/" continueLabel="Entrar a mi casa" />
      </>
    );
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <Field id="slug" label="Código de la casa" icon={House} type="text" required autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" />
      <Field
        id="recovery"
        label="Código de recuperación"
        icon={KeyRound}
        type="text"
        required
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        placeholder="XXXX-XXXX-XXXX-XXXX"
      />
      <Field id="password" label="Clave nueva" icon={LockKeyhole} type="password" required minLength={6} autoComplete="new-password" hint="Mínimo 6 caracteres." />
      <FormError>{state.error}</FormError>
      <SubmitButton pending={pending} idle="Cambiar la clave" busy="Cambiando…" />
      <p className="text-center text-sm text-ink-2">
        <Link href="/login" className="font-medium text-berry-ink underline-offset-4 hover:underline">
          Volver a entrar
        </Link>
      </p>
    </form>
  );
}

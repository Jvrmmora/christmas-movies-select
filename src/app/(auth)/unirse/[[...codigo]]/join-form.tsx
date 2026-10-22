"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { signUpAction, type LoginState } from "@/actions/auth";
import { AuthHeading } from "@/components/auth/auth-shell";
import { Field, FormError, SubmitButton } from "@/components/auth/fields";

export function SignUpForm({ invite, staleInvite = false }: { invite?: { name: string; inviteCode: string }; staleInvite?: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signUpAction, {});

  return (
    <AuthHeading
      title={invite ? `Te invitaron a ${invite.name}` : "Crea tu cuenta"}
      subtitle={invite ? "Crea tu cuenta y entras directo a la casa." : "Tu correo y una clave. Después creas tu casa o te unes a una."}
    >
      <form action={action} className="mt-7 flex flex-col gap-4">
        {invite && <input type="hidden" name="codigo" value={invite.inviteCode} />}
        {staleInvite && (
          <p className="rounded-[14px] bg-gold-soft px-4 py-3 text-sm">
            Ese link de invitación ya no funciona. Crea tu cuenta y pide el código más reciente a tu familia.
          </p>
        )}
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
          autoComplete="email"
          placeholder="tu@correo.com"
          hint="Con él entras, y ahí te enviamos un código si olvidas la clave."
        />
        <Field id="password" label="Clave" icon={LockKeyhole} type="password" required minLength={6} autoComplete="new-password" placeholder="Mínimo 6 caracteres" />
        <FormError>{state.error}</FormError>
        <SubmitButton pending={pending} idle="Crear cuenta" busy="Creando…" />
        <p className="text-center text-sm text-ink-2">
          ¿Ya tienes cuenta?{" "}
          <Link
            href={invite ? `/login?codigo=${invite.inviteCode}` : "/login"}
            className="font-semibold text-gold-ink underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </form>
    </AuthHeading>
  );
}

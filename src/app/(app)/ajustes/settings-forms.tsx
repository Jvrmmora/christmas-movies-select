"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { AtSign, House, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import { updateEmailAction, updateHomeAction, type SettingsState } from "@/actions/settings";
import { Field, FormError, SubmitButton } from "@/components/auth/fields";

const SLUG_KEY = "nv-home-slug";

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-7">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-ink-2">{description}</p>
      {children}
    </section>
  );
}

export function HomeForm({ name, slug }: { name: string; slug: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateHomeAction, {});

  useEffect(() => {
    if (!state.saved) return;
    toast.success("Casa actualizada");
    // The sign-in form remembers the code on this device; keep it pointing at the new one.
    try {
      if (state.slug) localStorage.setItem(SLUG_KEY, state.slug);
    } catch {
      /* storage can be blocked */
    }
  }, [state.saved, state.slug]);

  return (
    <Card title="Nombre y código" description="El código es lo que escribe la familia para entrar. Si lo cambian, el anterior deja de funcionar y todos deben usar el nuevo.">
      {/* Remount on a fresh save so the fields show what was stored. */}
      <form key={state.saved ?? "form"} action={action} className="mt-5 flex flex-col gap-4">
        <Field id="name" label="Nombre de la casa" icon={House} type="text" required maxLength={40} autoComplete="off" defaultValue={name} />
        <Field
          id="slug"
          label="Código de la casa"
          icon={AtSign}
          type="text"
          required
          minLength={3}
          maxLength={24}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          hint="Letras, números y guiones. Si ya lo usa otra familia, se lo avisamos."
          defaultValue={slug}
        />
        <FormError>{state.error}</FormError>
        <SubmitButton pending={pending} idle="Guardar cambios" busy="Guardando…" />
      </form>
    </Card>
  );
}

export function EmailForm({ email }: { email: string | null }) {
  const [editing, setEditing] = useState(!email);
  const [state, action, pending] = useActionState<SettingsState, FormData>(async (prev, formData) => {
    const next = await updateEmailAction(prev, formData);
    if (next.saved) {
      toast.success("Correo guardado");
      setEditing(false);
    }
    return next;
  }, {});

  return (
    <Card
      title="Correo y clave"
      description="Si olvidan la clave, enviamos un código a este correo para elegir una nueva. Para cambiar la clave ahora mismo, usen el mismo código."
    >
      {!editing && (
        <div className="mt-5 flex flex-col gap-4">
          <p className="flex items-center gap-2.5 rounded-[14px] border border-line bg-field px-4 py-3.5 text-[17px]">
            <Mail className="size-[18px] shrink-0 text-ink-2" strokeWidth={1.8} aria-hidden />
            <span className="min-w-0 truncate">{email}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setEditing(true)} className="nv-press h-11 rounded-full border border-line px-5 text-sm font-semibold hover:bg-surface-2">
              Cambiar correo
            </button>
            <Link href="/recuperar" className="nv-press grid h-11 place-items-center rounded-full border border-line px-5 text-sm font-semibold hover:bg-surface-2">
              Cambiar la clave por correo
            </Link>
          </div>
        </div>
      )}
      {editing && (
        <form action={action} className="mt-5 flex flex-col gap-4">
          <Field
            id="email"
            label="Correo"
            icon={Mail}
            type="email"
            required
            maxLength={254}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="email"
            placeholder="familia@correo.com"
            defaultValue={email ?? ""}
          />
          <Field id="password" label="Clave actual" icon={LockKeyhole} type="password" required autoComplete="current-password" hint="La pedimos para que nadie más pueda cambiar el correo." />
          <FormError>{state.error}</FormError>
          <SubmitButton pending={pending} idle="Guardar correo" busy="Guardando…" />
          {email && (
            <button type="button" onClick={() => setEditing(false)} className="text-center text-sm font-medium text-ink-2 underline-offset-4 hover:underline">
              Cancelar
            </button>
          )}
        </form>
      )}
    </Card>
  );
}

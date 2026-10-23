"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Copy, House, LockKeyhole, Mail, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { regenerateInviteAction } from "@/actions/home";
import { deleteAccountAction, updateCountryAction, updateEmailAction, updateHomeAction, updatePasswordAction, type SettingsState } from "@/actions/settings";
import { CountryField, Field, FormError, SubmitButton } from "@/components/auth/fields";

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-7">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-ink-2">{description}</p>
      {children}
    </section>
  );
}

async function copy(text: string, ok: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(ok);
  } catch {
    toast.error("No se pudo copiar");
  }
}

export function HomeForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateHomeAction, {});

  useEffect(() => {
    if (state.saved) toast.success("Casa actualizada");
  }, [state.saved]);

  return (
    <Card title="Nombre" description="Así la ve todo el que entra, y así aparece en las invitaciones.">
      {/* Remount on a fresh save so the field shows what was stored. */}
      <form key={state.saved ?? "form"} action={action} className="mt-5 flex flex-col gap-4">
        <Field id="name" label="Nombre de la casa" icon={House} type="text" required maxLength={40} autoComplete="off" defaultValue={name} />
        <FormError>{state.error}</FormError>
        <SubmitButton pending={pending} idle="Guardar cambios" busy="Guardando…" />
      </form>
    </Card>
  );
}

/** Where the home looks up where to watch. Changing it doesn't touch what is already saved. */
export function CountryForm({ country, countries }: { country: string; countries: { code: string; name: string }[] }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateCountryAction, {});

  useEffect(() => {
    if (state.saved) toast.success("País actualizado");
  }, [state.saved]);

  return (
    <Card title="País" description="De ahí salen las plataformas donde ver cada película y los títulos como se conocen allá.">
      <form key={state.saved ?? "form"} action={action} className="mt-5 flex flex-col gap-4">
        <CountryField label="País de la casa" countries={countries} defaultValue={country} />
        <p className="text-[13px] text-ink-2">
          Las películas que ya tienen guardadas conservan las plataformas del país anterior hasta que usen «Actualizar datos» en cada una.
        </p>
        <FormError>{state.error}</FormError>
        <SubmitButton pending={pending} idle="Guardar país" busy="Guardando…" />
      </form>
    </Card>
  );
}

export function InviteCard({ code: initial }: { code: string }) {
  const [code, setCode] = useState(initial);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const link = () => `${window.location.origin}/unirse/${code}`;

  function regenerate() {
    start(async () => {
      const res = await regenerateInviteAction();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCode(res.data.inviteCode);
      setConfirming(false);
      toast.success("Código nuevo listo; el anterior ya no funciona");
    });
  }

  return (
    <Card title="Invitar a la casa" description="Quien abra el link (o escriba el código al crear su cuenta) entra a esta casa con su propio perfil.">
      <div className="mt-5 flex flex-col gap-4">
        <p className="rounded-[14px] border border-line bg-field px-4 py-3.5 text-center font-mono text-[22px] font-semibold tracking-[0.06em] select-all">{code}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => copy(link(), "Link de invitación copiado")} className="nv-press flex h-11 items-center gap-2 rounded-full bg-berry px-5 text-sm font-semibold text-white">
            <Copy className="size-4" strokeWidth={1.9} aria-hidden />
            Copiar link
          </button>
          <button type="button" onClick={() => copy(code, "Código copiado")} className="nv-press h-11 rounded-full border border-line px-5 text-sm font-semibold hover:bg-surface-2">
            Copiar código
          </button>
          {!confirming && (
            <button type="button" onClick={() => setConfirming(true)} className="nv-press flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink-2">
              <RefreshCw className="size-4" strokeWidth={1.9} aria-hidden />
              Generar uno nuevo
            </button>
          )}
        </div>
        {confirming && (
          <div className="flex flex-wrap items-center gap-2 rounded-[14px] bg-gold-soft p-3 text-sm">
            <span className="flex-1">El link y el código actuales dejarán de funcionar. Quienes ya están en la casa no se ven afectados.</span>
            <button type="button" onClick={regenerate} disabled={pending} className="nv-press h-10 rounded-full bg-berry px-4 font-semibold text-white disabled:opacity-60">
              {pending ? "Generando…" : "Sí, cambiarlo"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="nv-press h-10 rounded-full border border-line px-4 font-semibold">
              No
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

export function EmailForm({ email }: { email: string }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<SettingsState, FormData>(async (prev, formData) => {
    const next = await updateEmailAction(prev, formData);
    if (next.saved) {
      toast.success("Correo guardado");
      setEditing(false);
    }
    return next;
  }, {});

  return (
    <Card title="Correo" description="Con él entras y ahí te llega el código si olvidas la clave.">
      {!editing && (
        <div className="mt-5 flex flex-col gap-4">
          <p className="flex items-center gap-2.5 rounded-[14px] border border-line bg-field px-4 py-3.5 text-[17px]">
            <Mail className="size-[18px] shrink-0 text-ink-2" strokeWidth={1.8} aria-hidden />
            <span className="min-w-0 truncate">{email}</span>
          </p>
          <button type="button" onClick={() => setEditing(true)} className="nv-press h-11 self-start rounded-full border border-line px-5 text-sm font-semibold hover:bg-surface-2">
            Cambiar correo
          </button>
        </div>
      )}
      {editing && (
        <form action={action} className="mt-5 flex flex-col gap-4">
          <Field
            id="email"
            label="Correo nuevo"
            icon={Mail}
            type="email"
            required
            maxLength={254}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="email"
            defaultValue={email}
          />
          <Field id="password" label="Clave actual" icon={LockKeyhole} type="password" required autoComplete="current-password" hint="La pedimos para que nadie más pueda cambiar tu correo." />
          <FormError>{state.error}</FormError>
          <SubmitButton pending={pending} idle="Guardar correo" busy="Guardando…" />
          <button type="button" onClick={() => setEditing(false)} className="text-center text-sm font-medium text-ink-2 underline-offset-4 hover:underline">
            Cancelar
          </button>
        </form>
      )}
    </Card>
  );
}

/** The danger zone: deleting the account needs the password, and says what goes with it before asking. */
export function DeleteAccountCard({ homeName, others }: { homeName: string; others: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<SettingsState, FormData>(deleteAccountAction, {});
  const consequence = others
    ? `Se borran tu cuenta y tu perfil. «${homeName}» sigue con ${others === 1 ? "la otra cuenta" : `las otras ${others} cuentas`} y todas sus películas; lo que agregaste o sugeriste se queda y aparece como «alguien que ya no está».`
    : `Eres la única cuenta de «${homeName}», así que también se borran la casa, sus películas, el calendario y sus perfiles.`;

  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-7">
      <h2 className="font-display text-lg font-bold text-berry-ink">Eliminar mi cuenta</h2>
      <p className="mt-1 text-sm text-ink-2">Esto no se puede deshacer.</p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="nv-press mt-5 flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-berry-ink hover:bg-surface-2">
          <Trash2 className="size-4" strokeWidth={1.9} aria-hidden />
          Eliminar mi cuenta
        </button>
      ) : (
        <form action={action} className="mt-5 flex flex-col gap-4">
          <p className="rounded-[14px] bg-berry-soft p-3.5 text-sm">{consequence}</p>
          <Field id="deletePassword" label="Tu clave" icon={LockKeyhole} type="password" required autoComplete="current-password" hint="La pedimos para que nadie más pueda borrar tu cuenta." />
          <FormError>{state.error}</FormError>
          <SubmitButton pending={pending} idle="Sí, eliminar mi cuenta" busy="Eliminando…" />
          <button type="button" onClick={() => setOpen(false)} className="text-center text-sm font-medium text-ink-2 underline-offset-4 hover:underline">
            Cancelar
          </button>
        </form>
      )}
    </section>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updatePasswordAction, {});

  useEffect(() => {
    if (state.saved) toast.success("Clave cambiada");
  }, [state.saved]);

  return (
    <Card title="Clave" description="Solo cambia la tuya; cada persona de la casa tiene la suya.">
      <form key={state.saved ?? "form"} action={action} className="mt-5 flex flex-col gap-4">
        <Field id="password" label="Clave actual" icon={LockKeyhole} type="password" required autoComplete="current-password" />
        <Field id="newPassword" label="Clave nueva" icon={LockKeyhole} type="password" required minLength={6} autoComplete="new-password" hint="Mínimo 6 caracteres." />
        <FormError>{state.error}</FormError>
        <SubmitButton pending={pending} idle="Cambiar la clave" busy="Cambiando…" />
        <Link href="/recuperar" className="text-center text-sm font-medium text-ink-2 underline-offset-4 hover:underline">
          ¿No la recuerdas? Recíbela por correo
        </Link>
      </form>
    </Card>
  );
}

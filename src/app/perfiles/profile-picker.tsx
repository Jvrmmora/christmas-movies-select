"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { logoutAction } from "@/actions/auth";
import { claimProfileAction, createProfileAction, deleteProfileAction, selectProfileAction, updateProfileAction } from "@/actions/profiles";
import { Avatar } from "@/components/avatars/avatar";
import { AvatarEditor, type ProfileDraft } from "@/components/avatars/avatar-editor";
import { CAST, randomAvatar } from "@/components/avatars/cast";
import { usePrefs } from "@/components/providers";
import { LIMITS } from "@/lib/limits";
import { starterAvatar } from "@/lib/avatar";
import type { HomeInfo, Profile } from "@/lib/types";

type View = { kind: "pick" } | { kind: "claim" } | { kind: "create"; own: boolean } | { kind: "edit"; id: string };

interface PickerProps {
  home: HomeInfo;
  profiles: Profile[];
  /** This account's profile, or null while it hasn't claimed or created one. */
  ownId: string | null;
  next: string;
  /** Where to go once the account has its own profile (the starter picks when the home is empty). */
  afterSetup: string;
  editId?: string;
}

/**
 * Next keeps the pages you leave alive, state included, and new props don't reset it. This screen is chosen once,
 * when it mounts (pick, claim, create, edit), so without a key a later visit would revive the old one: the
 * editor you finished with, or «¿Cuál eres tú?» for a profile you already have. Keyed on `bfcacheId`, every
 * fresh visit starts from the current data, while back/forward still restores what you left.
 */
export function ProfilePicker(props: PickerProps) {
  const { bfcacheId } = useRouter();
  return <PickerView key={bfcacheId} {...props} />;
}

function PickerView({ home, profiles, ownId, next, afterSetup, editId }: PickerProps) {
  const router = useRouter();
  const { play } = usePrefs();
  const [pending, start] = useTransition();
  const [manage, setManage] = useState(false);
  // Opened from the header's "Editar mi perfil": return to where they were once saved.
  const [returnAfterEdit] = useState(!!editId);
  const loose = profiles.filter((p) => !p.hasAccount);
  const room = profiles.length < LIMITS.profilesPerHome;
  const usable = (p: Profile) => !p.hasAccount || p.id === ownId;
  const [view, setView] = useState<View>(() => {
    if (!ownId) return loose.length ? { kind: "claim" } : { kind: "create", own: true };
    if (editId && profiles.some((p) => p.id === editId && usable(p))) return { kind: "edit", id: editId };
    return { kind: "pick" };
  });

  const enter = (to = next) => {
    play("jingle");
    router.replace(to);
  };

  function choose(id: string) {
    start(async () => {
      const res = await selectProfileAction(id);
      if (res.ok) enter();
      else toast.error(res.error);
    });
  }

  function claim(id: string) {
    start(async () => {
      const res = await claimProfileAction(id);
      if (res.ok) enter(afterSetup);
      else toast.error(res.error);
    });
  }

  if (view.kind === "claim") {
    return (
      <div className="nv-fade flex w-full flex-col items-center text-center">
        <p className="text-sm font-semibold tracking-wide text-gold-ink uppercase">{home.name}</p>
        <h1 className="mt-2 font-display text-[34px] leading-[1.1] font-bold tracking-[-0.035em] sm:text-[44px]">¿Cuál eres tú?</h1>
        <p className="mt-2 max-w-md text-ink-2">Si ya tenías un perfil en esta casa, elígelo y queda ligado a tu cuenta. Si no, crea el tuyo.</p>
        <ul className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-8">
          {loose.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => claim(p.id)}
                aria-label={`Soy ${p.name}`}
                className="nv-av-host group flex w-[136px] flex-col items-center gap-2.5 rounded-2xl p-2 transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 active:scale-95 disabled:opacity-70"
              >
                <Avatar avatar={p.avatar} size={116} className="shadow-card ring-4 ring-transparent transition-shadow group-hover:ring-gold group-focus-visible:ring-gold" />
                <span className="max-w-full truncate text-lg font-semibold">{p.name}</span>
                <span className="text-[13px] font-semibold text-gold-ink">Soy yo</span>
              </button>
            </li>
          ))}
          {room && <AddTile label="Crear el mío" detail="Un perfil nuevo" onClick={() => setView({ kind: "create", own: true })} />}
        </ul>
        <div className="mt-12">
          <LogoutButton />
        </div>
      </div>
    );
  }

  if (view.kind !== "pick") {
    const editing = view.kind === "edit" ? profiles.find((p) => p.id === view.id) : undefined;
    const own = view.kind === "create" && view.own;
    const back = !ownId ? (loose.length ? () => setView({ kind: "claim" }) : undefined) : () => setView({ kind: "pick" });
    return (
      <Editor
        key={view.kind === "edit" ? view.id : own ? "own" : "new"}
        title={own ? "Crea tu perfil" : editing ? "Editar perfil" : "Nuevo perfil"}
        subtitle={
          own ? `Así sabremos quién agrega y sugiere cada película en ${home.name}.` : editing ? undefined : "Para alguien de la casa sin cuenta, como los niños."
        }
        initial={editing ? { name: editing.name, avatar: editing.avatar } : { name: "", avatar: profiles.length === 0 ? randomAvatar() : starterAvatar(profiles.length) }}
        pending={pending}
        onCancel={back}
        canDelete={!!editing && !editing.hasAccount && profiles.length > 1}
        onSave={(draft) =>
          start(async () => {
            const res = editing ? await updateProfileAction(editing.id, draft) : await createProfileAction(draft, own);
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            if (own) enter(afterSetup);
            else if (editing && returnAfterEdit) router.replace(next);
            else setView({ kind: "pick" });
          })
        }
        onDelete={() =>
          start(async () => {
            if (!editing) return;
            const res = await deleteProfileAction(editing.id);
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.success(`Perfil de ${editing.name} eliminado`);
            setView({ kind: "pick" });
          })
        }
      />
    );
  }

  return (
    <div className="nv-fade flex w-full flex-col items-center text-center">
      <p className="text-sm font-semibold tracking-wide text-gold-ink uppercase">{home.name}</p>
      <h1 className="mt-2 font-display text-[34px] leading-[1.1] font-bold tracking-[-0.035em] sm:text-[44px]">
        {manage ? "Administrar perfiles" : "¿Quién está viendo la peli?"}
      </h1>

      <ul className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-8">
        {profiles.map((p) => {
          const cast = CAST[p.avatar.character];
          const mine = usable(p);
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={pending || !mine}
                onClick={() => (manage ? setView({ kind: "edit", id: p.id }) : choose(p.id))}
                aria-label={!mine ? `${p.name} (tiene su propia cuenta)` : manage ? `Editar el perfil de ${p.name}` : `Entrar como ${p.name}, ${cast.name}`}
                className="nv-av-host group flex w-[136px] flex-col items-center gap-2.5 rounded-2xl p-2 transition-transform duration-200 enabled:hover:-translate-y-1 enabled:focus-visible:-translate-y-1 enabled:active:scale-95 disabled:opacity-70"
              >
                <span className="relative">
                  <Avatar
                    avatar={p.avatar}
                    size={116}
                    className={`shadow-card ring-4 ring-transparent transition-shadow ${mine ? "group-hover:ring-gold group-focus-visible:ring-gold" : "opacity-60 grayscale"}`}
                  />
                  {manage && mine && (
                    <span className="absolute inset-0 grid place-items-center rounded-full bg-black/55 text-white">
                      <Pencil className="size-7" strokeWidth={1.8} aria-hidden />
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate text-lg font-semibold">{p.name}</span>
                <span className="min-h-10 text-[13px] leading-snug text-ink-2">
                  {!mine ? (
                    "Tiene su cuenta"
                  ) : (
                    <>
                      <span className="group-hover:hidden group-focus-visible:hidden">{p.id === ownId ? "Tú" : cast.trait}</span>
                      <span className="hidden group-hover:inline group-focus-visible:inline">«{cast.phrase}»</span>
                    </>
                  )}
                </span>
              </button>
            </li>
          );
        })}
        {room && <AddTile label="Añadir perfil" detail={`${profiles.length} de ${LIMITS.profilesPerHome}`} onClick={() => setView({ kind: "create", own: false })} />}
      </ul>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => setManage((m) => !m)}
          aria-pressed={manage}
          className={`nv-press h-11 rounded-full border px-5 text-[15px] font-semibold ${manage ? "border-gold bg-gold-soft" : "border-line bg-surface"}`}
        >
          {manage ? "Listo" : "Administrar perfiles"}
        </button>
        <LogoutButton />
      </div>
    </div>
  );
}

function AddTile({ label, detail, onClick }: { label: string; detail: string; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="group flex w-[136px] flex-col items-center gap-2.5 rounded-2xl p-2 transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 active:scale-95"
      >
        <span className="grid size-[116px] place-items-center rounded-full border-2 border-dashed border-ink-2 text-ink-2 transition-colors group-hover:border-gold group-hover:text-gold">
          <Plus className="size-9" strokeWidth={1.6} aria-hidden />
        </span>
        <span className="text-lg font-semibold">{label}</span>
        <span className="min-h-10 text-[13px] text-ink-2">{detail}</span>
      </button>
    </li>
  );
}

function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="nv-press flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-5 text-[15px] font-semibold text-ink-2">
        <LogOut className="size-4" strokeWidth={1.9} aria-hidden />
        Cerrar sesión
      </button>
    </form>
  );
}

function Editor({
  title,
  subtitle,
  initial,
  pending,
  canDelete,
  onSave,
  onCancel,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  initial: ProfileDraft;
  pending: boolean;
  canDelete: boolean;
  onSave: (draft: ProfileDraft) => void;
  onCancel?: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const valid = draft.name.trim().length > 0;

  return (
    <form
      className="nv-fade w-full max-w-[760px] rounded-[28px] bg-surface p-6 text-left shadow-card sm:p-10"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave({ ...draft, name: draft.name.trim() });
      }}
    >
      <h1 className="font-display text-[30px] leading-tight font-bold tracking-[-0.03em]">{title}</h1>
      {subtitle && <p className="mt-1 text-ink-2">{subtitle}</p>}
      <div className="mt-8">
        <AvatarEditor draft={draft} onChange={setDraft} />
      </div>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || !valid} className="nv-press h-12 rounded-full bg-berry px-7 text-base font-semibold text-white disabled:opacity-60">
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={pending} className="nv-press h-12 rounded-full border border-line px-6 text-base font-semibold">
            Cancelar
          </button>
        )}
        {canDelete &&
          (confirmDelete ? (
            <span className="ml-auto flex items-center gap-2 text-sm">
              ¿Eliminar este perfil?
              <button type="button" onClick={onDelete} disabled={pending} className="nv-press h-10 rounded-full bg-berry px-4 font-semibold text-white">
                Sí, eliminar
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="nv-press h-10 rounded-full border border-line px-4 font-semibold">
                No
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="nv-press ml-auto flex h-12 items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-berry-ink">
              <Trash2 className="size-4" strokeWidth={1.9} aria-hidden />
              Eliminar perfil
            </button>
          ))}
      </div>
    </form>
  );
}

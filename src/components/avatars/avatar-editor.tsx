"use client";

import { useId } from "react";
import { Dices } from "lucide-react";
import { ACCESSORIES, AVATAR_BACKGROUNDS, BACKGROUND_IDS, CHARACTERS, type AccessoryId, type Avatar as AvatarData, type AvatarBackgroundId, type CharacterId } from "@/lib/avatar";
import { Avatar } from "./avatar";
import { ACCESSORY_LABEL, BACKGROUND_LABEL, CAST, randomAvatar } from "./cast";

export interface ProfileDraft {
  name: string;
  avatar: AvatarData;
}

const pill = "nv-press rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors";

/** Live preview + character, color and accessory pickers. Purely presentational: the parent saves. */
export function AvatarEditor({ draft, onChange }: { draft: ProfileDraft; onChange: (next: ProfileDraft) => void }) {
  const nameId = useId();
  const { avatar } = draft;
  const cast = CAST[avatar.character];
  const set = (patch: Partial<AvatarData>) => onChange({ ...draft, avatar: { ...avatar, ...patch } });

  function pickCharacter(character: CharacterId) {
    // An accessory the new character already wears would be drawn twice; drop it.
    const accessory = CAST[character].builtIn.includes(avatar.accessory) ? "none" : avatar.accessory;
    set({ character, accessory });
  }

  return (
    <div className="grid gap-8 sm:grid-cols-[200px_1fr]">
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar avatar={avatar} size={168} animated className="shadow-card" />
        <p className="text-lg font-semibold">
          {cast.name} <span className="text-base font-normal text-ink-2">· {cast.trait}</span>
        </p>
        <p className="text-sm text-ink-2 italic">«{cast.phrase}»</p>
        <button type="button" onClick={() => onChange({ ...draft, avatar: randomAvatar() })} className={`${pill} flex items-center gap-2 border-line bg-surface text-ink`}>
          <Dices className="size-4" strokeWidth={1.9} aria-hidden />
          Sorpréndeme
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={nameId} className="text-[13px] font-semibold text-ink-2">
            Nombre
          </label>
          <input
            id={nameId}
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            maxLength={16}
            autoComplete="off"
            placeholder="¿Cómo te llamas?"
            className="h-[52px] rounded-[14px] border border-line bg-field px-4 text-[17px] text-ink outline-none focus:outline-[2.5px] focus:outline-offset-2 focus:outline-gold"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-ink-2">Personaje</legend>
          <div role="radiogroup" aria-label="Personaje" className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
            {CHARACTERS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={avatar.character === id}
                aria-label={`${CAST[id].name}, ${CAST[id].trait}`}
                onClick={() => pickCharacter(id)}
                className={`nv-press rounded-full p-0.5 ${avatar.character === id ? "ring-[3px] ring-gold" : "ring-1 ring-line hover:ring-2 hover:ring-ink-2"}`}
              >
                <Avatar avatar={{ character: id, bg: avatar.bg, accessory: "none" }} size={56} className="w-full" />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-ink-2">Color de fondo</legend>
          <div role="radiogroup" aria-label="Color de fondo" className="flex flex-wrap gap-2.5">
            {BACKGROUND_IDS.map((id: AvatarBackgroundId) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={avatar.bg === id}
                aria-label={BACKGROUND_LABEL[id]}
                title={BACKGROUND_LABEL[id]}
                onClick={() => set({ bg: id })}
                style={{ background: AVATAR_BACKGROUNDS[id] }}
                className={`nv-press size-9 rounded-full ${avatar.bg === id ? "ring-[3px] ring-gold ring-offset-2 ring-offset-surface" : "ring-1 ring-line"}`}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-ink-2">Accesorio</legend>
          <div role="radiogroup" aria-label="Accesorio" className="flex flex-wrap gap-2">
            {ACCESSORIES.map((id: AccessoryId) => {
              const worn = cast.builtIn.includes(id);
              const active = avatar.accessory === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={worn}
                  title={worn ? `${cast.name} ya lo trae` : undefined}
                  onClick={() => set({ accessory: id })}
                  className={`${pill} ${active ? "border-gold bg-gold-soft text-ink" : "border-line bg-surface text-ink-2"} ${worn ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {ACCESSORY_LABEL[id]}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

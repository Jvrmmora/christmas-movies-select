"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

interface FieldProps extends Omit<ComponentProps<"input">, "id" | "name"> {
  id: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
  error?: string;
}

export function Field({ id, label, icon: Icon, hint, error, type, ...input }: FieldProps) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink/90">
        {label}
      </label>
      <div className="flex h-[52px] items-center gap-2.5 rounded-[14px] border border-line bg-field px-4 transition-[border-color,box-shadow] focus-within:border-gold focus-within:shadow-[0_0_0_4px_var(--gold-soft)]">
        <Icon className="size-[18px] shrink-0 text-ink-2" strokeWidth={1.8} aria-hidden />
        <input
          id={id}
          name={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-ink-2"
          type={isPassword && reveal ? "text" : type}
          {...input}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Ocultar clave" : "Mostrar clave"}
            aria-pressed={reveal}
            className="-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-ink-2 hover:text-ink"
          >
            {reveal ? <EyeOff className="size-[18px]" strokeWidth={1.8} aria-hidden /> : <Eye className="size-[18px]" strokeWidth={1.8} aria-hidden />}
          </button>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-[13px] text-ink-2">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-berry-ink">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm font-medium text-berry-ink">
      {children}
    </p>
  );
}

export function SubmitButton({ pending, idle, busy }: { pending: boolean; idle: string; busy: string }) {
  return (
    <button type="submit" disabled={pending} className="nv-press mt-2 h-[52px] rounded-[14px] bg-berry text-base font-semibold text-white shadow-[0_10px_24px_rgba(200,16,46,.35)] disabled:opacity-70">
      {pending ? busy : idle}
    </button>
  );
}

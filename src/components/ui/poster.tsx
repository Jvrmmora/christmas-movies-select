"use client";
/* eslint-disable @next/next/no-img-element -- posters come from any host the user pastes; JustWatch already serves sized webp */

import { useState } from "react";
import { Clapperboard } from "lucide-react";

export function Poster({
  src,
  title,
  className = "",
  imgClassName = "",
  eager = false,
}: {
  src: string;
  title: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const show = !!src && !failed;
  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      {show ? (
        <img
          src={src}
          alt={`Póster de ${title}`}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover ${imgClassName}`}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-ink-2">
          <Clapperboard className="size-7" strokeWidth={1.5} aria-hidden />
          <span className="line-clamp-3 text-xs font-semibold">{title}</span>
        </div>
      )}
    </div>
  );
}

export function ProviderLogo({ src, name, className = "size-[22px] rounded-md" }: { src?: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span aria-label={name} className={`inline-grid shrink-0 place-items-center bg-surface-2 text-[10px] font-bold text-ink-2 ${className}`}>
        {name.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} className={`shrink-0 ${className}`} />;
}

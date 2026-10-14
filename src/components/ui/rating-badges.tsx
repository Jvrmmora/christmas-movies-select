/* eslint-disable @next/next/no-img-element -- static brand SVGs */
import { formatScore, rtVerdict } from "@/lib/format";
import type { Ratings } from "@/lib/types";

const RT_ICON = {
  certified: { src: "/logos/rt-certified.svg", alt: "Rotten Tomatoes: Certified Fresh" },
  fresh: { src: "/logos/rt-fresh.svg", alt: "Rotten Tomatoes: fresco" },
  rotten: { src: "/logos/rt-rotten.svg", alt: "Rotten Tomatoes: podrido" },
};

export function ImdbLogo({ className = "h-[15px]" }: { className?: string }) {
  return <img src="/logos/imdb.svg" alt="IMDb" className={`${className} w-auto shrink-0`} />;
}

export function RtLogo({ score, certified, className = "h-4" }: { score: number | null; certified: boolean; className?: string }) {
  const verdict = rtVerdict(score, certified);
  if (!verdict) return null;
  const { src, alt } = RT_ICON[verdict];
  return <img src={src} alt={alt} className={`${className} w-auto shrink-0`} />;
}

/** Compact IMDb + Rotten Tomatoes row used on cards. */
export function RatingBadges({ ratings, size = "sm" }: { ratings: Ratings; size?: "sm" | "md" }) {
  const md = size === "md";
  return (
    <div className={`flex items-center gap-3 font-semibold ${md ? "text-[15px]" : "text-[13px]"}`}>
      {ratings.imdb !== null && (
        <span className="inline-flex items-center gap-1.5">
          <ImdbLogo className={md ? "h-[19px]" : "h-[15px]"} />
          {formatScore(ratings.imdb)}
        </span>
      )}
      {ratings.rottenTomatoes !== null && (
        <span className="inline-flex items-center gap-1">
          <RtLogo score={ratings.rottenTomatoes} certified={ratings.certifiedFresh} className={md ? "h-5" : "h-4"} />
          {ratings.rottenTomatoes}%
        </span>
      )}
    </div>
  );
}

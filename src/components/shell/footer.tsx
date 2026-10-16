import { BrandMark } from "./decor";

const TECH = ["Next.js", "TypeScript", "MongoDB Atlas", "Vercel", "JustWatch"];
const REPO = "https://github.com/Jvrmmora/christmas-movies-select";

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-4 border-t border-line">
      <div className="mx-auto flex max-w-[860px] flex-col items-center gap-4 px-6 pt-10 pb-12 text-center">
        <div className="flex items-center gap-2.5 text-ink">
          <BrandMark className="size-8 rounded-[10px]" />
          <span className="text-base font-bold tracking-[-0.01em]">Navidad en casa</span>
        </div>
        <p className="max-w-[460px] text-sm text-ink-2">Sus películas de Navidad, dónde verlas en Colombia y un calendario de adviento con una película por día.</p>
        <ul className="flex flex-wrap justify-center gap-2" aria-label="Tecnologías">
          {TECH.map((t) => (
            <li key={t} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-2">
              {t}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink">
          <a href={REPO} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold hover:text-berry-ink">
            <GithubMark />
            Código en GitHub
          </a>
          <span className="text-ink-2">© 2026 Javier Montaño</span>
        </div>
        <p className="max-w-[560px] text-xs leading-relaxed text-ink-2">
          Proyecto personal independiente. Disponibilidad según{" "}
          <a href="https://www.justwatch.com/co" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
            JustWatch
          </a>
          . IMDb, Rotten Tomatoes, Netflix, Disney+, Prime Video, HBO Max y Movistar TV son marcas de sus dueños; este proyecto no está afiliado ni avalado por ellos.
        </p>
      </div>
    </footer>
  );
}

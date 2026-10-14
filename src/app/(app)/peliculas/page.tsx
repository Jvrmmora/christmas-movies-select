import type { Metadata } from "next";
import { Suspense } from "react";
import { MoviesBrowser } from "@/components/movies/movies-browser";
import { PosterGridSkeleton } from "@/components/skeletons";
import { getCalendar, getMovies } from "@/lib/dal";

export const metadata: Metadata = { title: "Películas" };

export default function MoviesPage() {
  return (
    <main className="mx-auto max-w-[1240px] px-4 pt-8 pb-16 sm:px-8 sm:pt-10">
      <Suspense fallback={<PosterGridSkeleton />}>
        <Movies />
      </Suspense>
    </main>
  );
}

async function Movies() {
  const [movies, calendar] = await Promise.all([getMovies(), getCalendar()]);
  return <MoviesBrowser movies={movies} calendar={calendar} />;
}

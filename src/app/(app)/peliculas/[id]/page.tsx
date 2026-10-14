import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MovieDetail } from "@/components/movies/movie-detail";
import { DetailSkeleton } from "@/components/skeletons";
import { getCalendar, getMovie } from "@/lib/dal";

export const metadata: Metadata = { title: "Película" };

export default function MoviePage({ params }: PageProps<"/peliculas/[id]">) {
  return (
    <main>
      <Suspense fallback={<DetailSkeleton />}>
        <Detail params={params} />
      </Suspense>
    </main>
  );
}

async function Detail({ params }: { params: PageProps<"/peliculas/[id]">["params"] }) {
  const { id } = await params;
  const [movie, calendar] = await Promise.all([getMovie(id), getCalendar()]);
  if (!movie) notFound();
  const calendarDate = Object.entries(calendar.assignments).find(([k, v]) => v === movie.id && k >= calendar.startDate && k <= calendar.endDate)?.[0] ?? null;
  return <MovieDetail key={movie.id} movie={movie} calendarDate={calendarDate} />;
}

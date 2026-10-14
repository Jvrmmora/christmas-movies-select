import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MovieForm } from "@/components/movies/movie-form";
import { Bone } from "@/components/skeletons";
import { getCalendar, getMovie } from "@/lib/dal";

export const metadata: Metadata = { title: "Editar película" };

export default function EditMoviePage({ params }: PageProps<"/peliculas/[id]/editar">) {
  return (
    <main className="px-4 pt-8 pb-16 sm:px-8 sm:pt-10">
      <Suspense fallback={<Bone className="mx-auto h-[600px] max-w-[1040px] rounded-3xl" />}>
        <EditMovie params={params} />
      </Suspense>
    </main>
  );
}

async function EditMovie({ params }: { params: PageProps<"/peliculas/[id]/editar">["params"] }) {
  const { id } = await params;
  const [movie, calendar] = await Promise.all([getMovie(id), getCalendar()]);
  if (!movie) notFound();
  const calendarDate = Object.entries(calendar.assignments).find(([k, v]) => v === movie.id && k >= calendar.startDate && k <= calendar.endDate)?.[0] ?? null;
  return <MovieForm key={movie.id} movie={movie} calendar={calendar} calendarDate={calendarDate} />;
}

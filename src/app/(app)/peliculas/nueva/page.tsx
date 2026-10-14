import type { Metadata } from "next";
import { Suspense } from "react";
import { MovieForm } from "@/components/movies/movie-form";
import { Bone } from "@/components/skeletons";
import { getCalendar } from "@/lib/dal";

export const metadata: Metadata = { title: "Agregar película" };

export default function NewMoviePage() {
  return (
    <main className="px-4 pt-8 pb-16 sm:px-8 sm:pt-10">
      <Suspense fallback={<Bone className="mx-auto h-[600px] max-w-[1040px] rounded-3xl" />}>
        <NewMovie />
      </Suspense>
    </main>
  );
}

async function NewMovie() {
  const calendar = await getCalendar();
  return <MovieForm calendar={calendar} />;
}

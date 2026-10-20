import type { Metadata } from "next";
import { Suspense } from "react";
import { RangeSetup } from "@/components/advent/range-setup";
import { Bone } from "@/components/skeletons";
import { getCalendar, getMovies } from "@/lib/dal";

export const metadata: Metadata = { title: "Rango del calendario" };

export default function CalendarRangePage() {
  return (
    <main className="mx-auto max-w-[1240px] px-4 pt-8 pb-16 sm:px-8 sm:pt-10">
      <Suspense fallback={<Bone className="mx-auto h-[420px] max-w-[880px] rounded-3xl" />}>
        <Range />
      </Suspense>
    </main>
  );
}

async function Range() {
  const [movies, calendar] = await Promise.all([getMovies(), getCalendar()]);
  return <RangeSetup calendar={calendar} pendingCount={movies.filter((m) => !m.watched).length} />;
}

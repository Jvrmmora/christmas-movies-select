import type { Metadata } from "next";
import { Suspense } from "react";
import { AdventCalendar } from "@/components/advent/advent-calendar";
import { RangeSetup } from "@/components/advent/range-setup";
import { CalendarSkeleton } from "@/components/skeletons";
import { ProfilesProvider } from "@/components/profiles/profiles-provider";
import { getCalendar, getMovies, getProfileContext } from "@/lib/dal";

export const metadata: Metadata = { title: "Calendario de adviento" };

export default function CalendarPage() {
  return (
    <main className="mx-auto max-w-[1440px] px-3 pt-8 pb-56 sm:px-8 sm:pt-10 md:pb-16">
      <Suspense fallback={<CalendarSkeleton />}>
        <Calendar />
      </Suspense>
    </main>
  );
}

async function Calendar() {
  const [movies, calendar, ctx] = await Promise.all([getMovies(), getCalendar(), getProfileContext()]);
  // Step 1 until the household picks its range; then the wide organiser (step 2).
  if (!calendar.configured) return <RangeSetup calendar={calendar} pendingCount={movies.filter((m) => !m.watched).length} />;
  return (
    <ProfilesProvider {...ctx}>
      <AdventCalendar movies={movies} calendar={calendar} />
    </ProfilesProvider>
  );
}

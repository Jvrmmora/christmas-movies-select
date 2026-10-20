import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { DashboardSkeleton } from "@/components/skeletons";
import { ProfilesProvider } from "@/components/profiles/profiles-provider";
import { getCalendar, getMovies, getProfileContext } from "@/lib/dal";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-[1240px] px-4 pt-8 pb-16 sm:px-8 sm:pt-12">
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  const [movies, calendar, ctx] = await Promise.all([getMovies(), getCalendar(), getProfileContext()]);
  return (
    <ProfilesProvider {...ctx}>
      <DashboardView movies={movies} calendar={calendar} />
    </ProfilesProvider>
  );
}

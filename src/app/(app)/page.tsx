import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { DashboardSkeleton } from "@/components/skeletons";
import { ProfilesProvider } from "@/components/profiles/profiles-provider";
import { getCalendar, getMovies, getProfileContext, getStarterOffered } from "@/lib/dal";
import { shouldOfferStarter } from "@/lib/starter";

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
  const [movies, calendar, ctx, offered] = await Promise.all([getMovies(), getCalendar(), getProfileContext(), getStarterOffered()]);
  // A brand-new home sees the starter classics first, whichever way it got here; they are shown only once.
  if (shouldOfferStarter(movies.length, offered)) redirect("/bienvenida/peliculas");
  return (
    <ProfilesProvider {...ctx}>
      <DashboardView movies={movies} calendar={calendar} />
    </ProfilesProvider>
  );
}

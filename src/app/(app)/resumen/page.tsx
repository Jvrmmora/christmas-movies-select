import type { Metadata } from "next";
import { Suspense } from "react";
import { HouseSummary } from "@/components/insights/house-summary";
import { ProfilesProvider } from "@/components/profiles/profiles-provider";
import { SummarySkeleton } from "@/components/skeletons";
import { getHome, getMovies, getProfileContext } from "@/lib/dal";
import { computeInsights } from "@/lib/insights";

export const metadata: Metadata = { title: "Resumen" };

export default function SummaryPage() {
  return (
    <main className="mx-auto max-w-[1240px] px-4 pt-8 pb-16 sm:px-8 sm:pt-12">
      <Suspense fallback={<SummarySkeleton />}>
        <Summary />
      </Suspense>
    </main>
  );
}

async function Summary() {
  const [movies, home, ctx] = await Promise.all([getMovies(), getHome(), getProfileContext()]);
  return (
    <ProfilesProvider {...ctx}>
      <HouseSummary insights={computeInsights(movies)} houseName={home.name} />
    </ProfilesProvider>
  );
}

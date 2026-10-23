import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { StarterPicks } from "@/components/movies/starter-picks";
import { PosterGridSkeleton } from "@/components/skeletons";
import { getCurrentProfile, getHome, getMovieCount, verifySession } from "@/lib/dal";
import { markStarterOffered } from "@/lib/homes";
import { getStarterPicks } from "@/lib/suggestions";
import type { Candidate } from "@/lib/types";

export const metadata: Metadata = { title: "Para empezar" };

export default function StarterPage() {
  return (
    <main className="mx-auto max-w-[1040px] px-4 pt-8 pb-16 sm:px-8 sm:pt-10">
      <Suspense fallback={<PosterGridSkeleton />}>
        <Starter />
      </Suspense>
    </main>
  );
}

async function Starter() {
  const [profile, count, { homeId }, { country }] = await Promise.all([getCurrentProfile(), getMovieCount(), verifySession(), getHome()]);
  // Only for an empty home: once there is a list, this screen has nothing to add.
  if (count > 0) redirect("/");
  // Shown once: from now on the inicio stops sending this home here (so "Ahora no" doesn't loop).
  await markStarterOffered(homeId);
  let picks: Candidate[] | null = null;
  try {
    picks = await getStarterPicks(country);
  } catch {
    picks = null;
  }
  return <StarterPicks name={profile.name} picks={picks} />;
}

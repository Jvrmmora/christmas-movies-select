import type { Metadata } from "next";
import { Suspense } from "react";
import { PosterGridSkeleton } from "@/components/skeletons";
import { SuggestionsBrowser } from "@/components/suggestions/suggestions-browser";
import { verifySession } from "@/lib/dal";
import { getLibraryIndex } from "@/lib/library";
import { findInLibrary } from "@/lib/library-match";
import { getSuggestionPool } from "@/lib/suggestions";
import type { Candidate } from "@/lib/types";

export const metadata: Metadata = { title: "Sugeridas" };

export default function SuggestionsPage() {
  return (
    <main className="mx-auto max-w-[1240px] px-4 pt-8 pb-16 sm:px-8 sm:pt-10">
      <Suspense fallback={<PosterGridSkeleton />}>
        <Suggestions />
      </Suspense>
    </main>
  );
}

async function Suggestions() {
  const { ownerId } = await verifySession();
  let data: { suggestions: Candidate[]; total: number } | null = null;
  try {
    const [pool, library] = await Promise.all([getSuggestionPool(), getLibraryIndex(ownerId)]);
    data = { suggestions: pool.filter((c) => !findInLibrary(library, c)), total: pool.length };
  } catch {
    data = null;
  }
  if (!data) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-[28px] bg-surface px-6 py-16 text-center shadow-card">
        <h1 className="text-2xl font-bold">No pudimos cargar las sugeridas</h1>
        <p className="text-ink-2">JustWatch no respondió. Recarguen la página en un momento.</p>
      </div>
    );
  }
  return <SuggestionsBrowser suggestions={data.suggestions} totalCatalog={data.total} />;
}

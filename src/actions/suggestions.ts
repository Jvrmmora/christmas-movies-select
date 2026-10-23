"use server";

import { getHomeCountry } from "@/lib/homes";
import { getLibraryIndex } from "@/lib/library";
import { loadMoreSuggestions, type SuggestionCursor } from "@/lib/suggestions-more";
import type { ActionResult, Candidate } from "@/lib/types";
import { errorMessage, requireOwner } from "./guard";

/** Next batch of suggestions: never repeats `seen`, never includes the library. */
export async function loadMoreSuggestionsAction(
  seen: string[],
  cursor: SuggestionCursor | null,
): Promise<ActionResult<{ items: Candidate[]; cursor: SuggestionCursor | null }>> {
  try {
    const ownerId = await requireOwner();
    const [library, country] = await Promise.all([getLibraryIndex(ownerId), getHomeCountry(ownerId)]);
    const safeSeen = Array.isArray(seen) ? seen.filter((s) => typeof s === "string").slice(0, 1000) : [];
    const safeCursor =
      cursor && Number.isInteger(cursor.term) && cursor.term >= 0 && (cursor.after === null || typeof cursor.after === "string") ? cursor : null;
    return { ok: true, data: await loadMoreSuggestions({ seen: safeSeen, library, cursor: safeCursor, country }) };
  } catch (err) {
    return { ok: false, error: errorMessage(err, "No pudimos cargar más sugeridas.") };
  }
}

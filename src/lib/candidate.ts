import type { Candidate } from "./types";
import type { MovieInput } from "./validation";

/** A JustWatch match, ready to save as a movie. */
export function candidateToInput(c: Candidate, title?: string): MovieInput {
  const { justwatchId: _id, score: _score, inLibrary: _in, ...data } = c;
  return { ...data, title: title || c.title, source: "auto" };
}

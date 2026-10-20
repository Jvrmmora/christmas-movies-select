interface Credited {
  addedBy: string | null;
  suggestedBy: string | null;
  updatedBy: string | null;
}

export const GONE = "alguien que ya no está";

/**
 * "Sugerida por Rudolfo · agregada por Ana · editada por Leo". Collapses when one person did both,
 * leaves out what is unknown (movies saved before profiles) and only mentions an edit by someone other
 * than whoever added it. Returns "" when nobody can be credited.
 */
export function creditsLine(movie: Credited, nameOf: (id: string) => string | null): string {
  const name = (id: string | null) => (id ? (nameOf(id) ?? GONE) : null);
  const suggested = name(movie.suggestedBy);
  const added = name(movie.addedBy);
  const edited = movie.updatedBy && movie.updatedBy !== movie.addedBy ? name(movie.updatedBy) : null;

  const parts: string[] = [];
  if (suggested && added && movie.suggestedBy === movie.addedBy) parts.push(`sugerida y agregada por ${suggested}`);
  else {
    if (suggested) parts.push(`sugerida por ${suggested}`);
    if (added) parts.push(`agregada por ${added}`);
  }
  if (edited) parts.push(`editada por ${edited}`);
  const line = parts.join(" · ");
  return line.charAt(0).toUpperCase() + line.slice(1);
}

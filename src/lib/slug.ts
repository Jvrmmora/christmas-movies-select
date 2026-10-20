/** "Casa Montaño 🎄" → "casa-montano": lowercase, accents stripped, only letters, digits and inner dashes, ≤ 24. */
export function slugify(input: string, max = 24): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
}

/** The code suggested for a new home: its name as a slug, padded with "casa-" when the name is too short to be one. */
export function homeSlugFromName(name: string): string {
  const slug = slugify(name);
  if (slug.length >= 3) return slug;
  const padded = slugify(`casa ${name}`);
  return padded.length >= 3 ? padded : "casa";
}

function withSuffix(base: string, suffix: string, max = 24): string {
  const room = max - suffix.length - 1;
  return `${base.slice(0, room).replace(/-+$/g, "")}-${suffix}`;
}

/**
 * Codes to try, in order, when a suggested code is already taken: the code itself, then -2 … -9,
 * then a few short random endings. Every candidate stays within 24 characters.
 */
export function slugCandidates(base: string, randomSuffix: () => string, randomTries = 3): string[] {
  const out = [base];
  for (let n = 2; n <= 9; n++) out.push(withSuffix(base, String(n)));
  for (let i = 0; i < randomTries; i++) out.push(withSuffix(base, randomSuffix()));
  return out;
}

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

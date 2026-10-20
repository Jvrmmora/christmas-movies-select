/** "Ana y Leo" / "Ana, Leo & Sofi" → ["Ana", "Leo", "Sofi"]. Used to seed profiles from the old greeting name. */
export function splitDisplayName(displayName: string, max = 8): string[] {
  const names = displayName
    .split(/\s*(?:,|&|\by\b|\be\b|\+)\s*/i)
    .map((n) => n.trim().slice(0, 16))
    .filter(Boolean);
  return [...new Set(names)].slice(0, max);
}

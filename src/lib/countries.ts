/**
 * Countries a home can pick. Where a movie can be watched depends on the country, so each home has its own.
 * Every code was checked against JustWatch (Puerto Rico, for one, isn't served there).
 */
export const COUNTRY_CODES = [
  "AR", "AU", "BO", "BR", "CA", "CL", "CO", "CR", "DE", "DO", "EC", "ES", "FR", "GB", "GT", "HN", "IE", "IT",
  "MX", "NI", "NZ", "PA", "PE", "PT", "PY", "SV", "US", "UY", "VE",
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

/** Homes made before countries existed were all set up for this one, so a missing country means it. */
export const LEGACY_COUNTRY: CountryCode = "CO";

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && (COUNTRY_CODES as readonly string[]).includes(value);
}

/** A stored value (possibly missing or from an older version) as a country that can be used. */
export function toCountry(value: unknown): CountryCode {
  return isCountryCode(value) ? value : LEGACY_COUNTRY;
}

// Spanish-speaking countries get their own variant of Spanish, so titles read the way people there know them
// («Mi pobre angelito» in Latin America, «Solo en casa» in Spain). Anywhere else, plain Spanish.
const OWN_SPANISH: ReadonlySet<CountryCode> = new Set(["AR", "BO", "CL", "CO", "CR", "DO", "EC", "ES", "GT", "HN", "MX", "NI", "PA", "PE", "PY", "SV", "US", "UY", "VE"]);

/** The language tag JustWatch gets for titles and descriptions in this country. */
export function justwatchLanguage(country: CountryCode): string {
  return OWN_SPANISH.has(country) ? `es-${country}` : "es";
}

const names = new Intl.DisplayNames("es", { type: "region" });

/** «Colombia», «México», «España»… */
export function countryName(country: CountryCode): string {
  return names.of(country) ?? country;
}

/** Every country, by name in Spanish, for a picker. */
export function countryOptions(): { code: CountryCode; name: string }[] {
  return COUNTRY_CODES.map((code) => ({ code, name: countryName(code) })).sort((a, b) => a.name.localeCompare(b.name, "es"));
}

/** The country behind a browser language like «es-MX», when it's one we serve; null otherwise. */
export function guessCountry(locale: string | null | undefined): CountryCode | null {
  const region = locale?.split("-")[1]?.toUpperCase();
  return isCountryCode(region) ? region : null;
}

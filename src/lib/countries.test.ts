import { describe, expect, it } from "vitest";
import { COUNTRY_CODES, countryName, countryOptions, guessCountry, isCountryCode, justwatchLanguage, LEGACY_COUNTRY, toCountry } from "./countries";

describe("countries", () => {
  it("recognizes only the countries we serve", () => {
    expect(isCountryCode("MX")).toBe(true);
    expect(isCountryCode("PR")).toBe(false);
    expect(isCountryCode("mx")).toBe(false);
    expect(isCountryCode(undefined)).toBe(false);
    expect(isCountryCode("US; drop")).toBe(false);
  });

  it("treats a missing or unknown stored country as the legacy one", () => {
    expect(LEGACY_COUNTRY).toBe("CO");
    expect(toCountry(undefined)).toBe("CO");
    expect(toCountry("ZZ")).toBe("CO");
    expect(toCountry("AR")).toBe("AR");
  });

  it("asks JustWatch for each country's own Spanish where there is one", () => {
    expect(justwatchLanguage("CO")).toBe("es-CO");
    expect(justwatchLanguage("MX")).toBe("es-MX");
    expect(justwatchLanguage("ES")).toBe("es-ES");
    expect(justwatchLanguage("US")).toBe("es-US");
  });

  it("falls back to plain Spanish elsewhere", () => {
    expect(justwatchLanguage("BR")).toBe("es");
    expect(justwatchLanguage("GB")).toBe("es");
    expect(justwatchLanguage("DE")).toBe("es");
  });

  it("names countries in Spanish", () => {
    expect(countryName("CO")).toBe("Colombia");
    expect(countryName("MX")).toBe("México");
    expect(countryName("ES")).toBe("España");
    expect(countryName("US")).toBe("Estados Unidos");
  });

  it("lists every country once, ordered by its Spanish name", () => {
    const options = countryOptions();
    expect(options).toHaveLength(COUNTRY_CODES.length);
    expect(new Set(options.map((o) => o.code)).size).toBe(COUNTRY_CODES.length);
    const names = options.map((o) => o.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "es")));
  });

  it("guesses the country from a browser language", () => {
    expect(guessCountry("es-MX")).toBe("MX");
    expect(guessCountry("es-ar")).toBe("AR");
    expect(guessCountry("en-US")).toBe("US");
    expect(guessCountry("es")).toBeNull();
    expect(guessCountry("es-419")).toBeNull();
    expect(guessCountry("fr-PR")).toBeNull();
    expect(guessCountry(undefined)).toBeNull();
  });
});

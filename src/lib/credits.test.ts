import { describe, expect, it } from "vitest";
import { creditsLine } from "./credits";

const NAMES: Record<string, string> = { a: "Ana", l: "Leo", r: "Rudolfo" };
const nameOf = (id: string) => NAMES[id] ?? null;

describe("creditsLine", () => {
  it("collapses when the same person suggested and added", () => {
    expect(creditsLine({ addedBy: "a", suggestedBy: "a", updatedBy: "a" }, nameOf)).toBe("Sugerida y agregada por Ana");
  });

  it("separates suggester and adder", () => {
    expect(creditsLine({ addedBy: "a", suggestedBy: "r", updatedBy: "a" }, nameOf)).toBe("Sugerida por Rudolfo · agregada por Ana");
  });

  it("mentions an edit only when someone other than the adder made it", () => {
    expect(creditsLine({ addedBy: "a", suggestedBy: "a", updatedBy: "l" }, nameOf)).toBe("Sugerida y agregada por Ana · editada por Leo");
    expect(creditsLine({ addedBy: "a", suggestedBy: "a", updatedBy: "a" }, nameOf)).not.toContain("editada");
  });

  it("says nothing for movies saved before profiles existed", () => {
    expect(creditsLine({ addedBy: null, suggestedBy: null, updatedBy: null }, nameOf)).toBe("");
  });

  it("credits only what is known", () => {
    expect(creditsLine({ addedBy: "a", suggestedBy: null, updatedBy: "a" }, nameOf)).toBe("Agregada por Ana");
    expect(creditsLine({ addedBy: null, suggestedBy: "r", updatedBy: null }, nameOf)).toBe("Sugerida por Rudolfo");
  });

  it("names people who left the home neutrally", () => {
    expect(creditsLine({ addedBy: "x", suggestedBy: "x", updatedBy: "x" }, nameOf)).toBe("Sugerida y agregada por alguien que ya no está");
  });
});

import { describe, expect, it } from "vitest";
import { parseKey, rangeDays } from "./calendar";
import { planSmartFill, type SmartMovie } from "./smart-calendar";

let n = 0;
function movie(over: Partial<SmartMovie> = {}): SmartMovie {
  n += 1;
  return { id: `m${n}`, runtimeMinutes: 90, genres: [`Género ${n}`], myRating: null, favorite: false, ratings: { imdb: null, rottenTomatoes: null, certifiedFresh: false }, ...over };
}

// 2026-12-14 is a Monday, so the 19th and 20th are the weekend.
const WEEK = rangeDays("2026-12-14", "2026-12-20");
const idsByDay = (next: Record<string, string>, days: string[]) => days.map((k) => next[k]);

describe("planSmartFill", () => {
  it("puts long movies on Saturday and Sunday and short ones on weeknights", () => {
    const long = [movie({ runtimeMinutes: 150 }), movie({ runtimeMinutes: 140 })];
    const short = Array.from({ length: 5 }, () => movie({ runtimeMinutes: 90 }));
    const { next, placed, left } = planSmartFill(WEEK, {}, [...long, ...short], "2026-12-14");
    expect([placed, left]).toEqual([7, 0]);
    expect(new Set([next["2026-12-19"], next["2026-12-20"]])).toEqual(new Set(long.map((m) => m.id)));
    expect(new Set(idsByDay(next, WEEK.slice(0, 5)))).toEqual(new Set(short.map((m) => m.id)));
  });

  it("treats a movie without a runtime as medium: it fits any day", () => {
    const unknown = movie({ runtimeMinutes: null });
    const { next } = planSmartFill(rangeDays("2026-12-19", "2026-12-19"), {}, [unknown], "2026-12-19");
    expect(next["2026-12-19"]).toBe(unknown.id);
  });

  it("raises the best liked towards the end: stars, then the heart, then IMDb", () => {
    const one = movie({ myRating: 1 });
    const two = movie({ myRating: 2 });
    const hearted = movie({ myRating: 3, favorite: true });
    const three = movie({ myRating: 3 });
    const days = rangeDays("2026-12-14", "2026-12-17");
    // Handed over in a scrambled order.
    const { next } = planSmartFill(days, {}, [hearted, one, three, two], "2026-12-14");
    expect(idsByDay(next, days)).toEqual([one.id, two.id, three.id, hearted.id]);
  });

  it("doesn't repeat the main genre on consecutive days when it can avoid it", () => {
    const comedies = [movie({ genres: ["Comedia"] }), movie({ genres: ["Comedia"] })];
    const dramas = [movie({ genres: ["Drama"] }), movie({ genres: ["Drama"] })];
    const days = rangeDays("2026-12-14", "2026-12-17");
    const { next } = planSmartFill(days, {}, [...comedies, ...dramas], "2026-12-14");
    const genres = idsByDay(next, days).map((id) => [...comedies, ...dramas].find((m) => m.id === id)!.genres[0]);
    for (let i = 1; i < genres.length; i++) expect(genres[i]).not.toBe(genres[i - 1]);
  });

  it("keeps Christmas Eve free while there are spare days", () => {
    const days = rangeDays("2026-12-22", "2026-12-24");
    const { next, placed, left } = planSmartFill(days, {}, [movie(), movie()], "2026-12-22");
    expect([placed, left]).toEqual([2, 0]);
    expect(next["2026-12-24"]).toBeUndefined();
    expect(next["2026-12-22"] && next["2026-12-23"]).toBeTruthy();
  });

  it("uses Christmas Eve when the movies need every day", () => {
    const days = rangeDays("2026-12-22", "2026-12-24");
    const { next, placed, left } = planSmartFill(days, {}, [movie(), movie(), movie()], "2026-12-22");
    expect([placed, left]).toEqual([3, 0]);
    expect(next["2026-12-24"]).toBeTruthy();
  });

  it("leaves out the least liked when they don't all fit", () => {
    const loved = movie({ myRating: 5 });
    const meh = movie({ myRating: 3 });
    const bad = movie({ myRating: 1 });
    const days = rangeDays("2026-12-15", "2026-12-16");
    const { next, placed, left } = planSmartFill(days, {}, [bad, loved, meh], "2026-12-15");
    expect([placed, left]).toEqual([2, 1]);
    expect(Object.values(next)).toEqual([meh.id, loved.id]);
  });

  it("leaves existing days alone and moves a movie out of its old day", () => {
    const moving = movie();
    const days = rangeDays("2026-12-14", "2026-12-16");
    const { next } = planSmartFill(days, { "2026-12-14": "kept", "2026-12-30": moving.id, "2026-12-25": "elsewhere" }, [moving], "2026-12-14");
    expect(next["2026-12-14"]).toBe("kept");
    expect(next["2026-12-25"]).toBe("elsewhere");
    expect(next["2026-12-30"]).toBeUndefined();
    expect(Object.values(next).filter((id) => id === moving.id)).toHaveLength(1);
  });

  it("fills days from `fromKey` first and earlier free days only when needed", () => {
    const days = rangeDays("2026-12-14", "2026-12-17");
    const { next } = planSmartFill(days, {}, [movie(), movie()], "2026-12-16");
    expect(Object.keys(next).sort()).toEqual(["2026-12-16", "2026-12-17"]);
    const spill = planSmartFill(days, {}, [movie(), movie(), movie()], "2026-12-16");
    // The overflow goes to the earliest free day, like planAutoFill.
    expect(Object.keys(spill.next).sort()).toEqual(["2026-12-14", "2026-12-16", "2026-12-17"]);
  });

  it("places nothing without movies or without free days", () => {
    expect(planSmartFill(WEEK, {}, [], "2026-12-14")).toEqual({ next: {}, placed: 0, left: 0 });
    const full = Object.fromEntries(WEEK.map((k) => [k, `x${k}`]));
    expect(planSmartFill(WEEK, full, [movie()], "2026-12-14")).toMatchObject({ placed: 0, left: 1 });
  });

  it("is deterministic", () => {
    const pool = [movie({ myRating: 4 }), movie({ runtimeMinutes: 150 }), movie({ genres: ["Comedia"] }), movie({ favorite: true })];
    expect(planSmartFill(WEEK, {}, pool, "2026-12-14")).toEqual(planSmartFill(WEEK, {}, pool, "2026-12-14"));
  });

  it("reads weekdays in local time", () => {
    expect(parseKey("2026-12-19").getDay()).toBe(6);
    expect(parseKey("2026-12-20").getDay()).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { coreFinisher, defaultRoutine, dueRoutineItems, estimateKm, roundWeight, routineForDate, sleepBetween } from "@/lib/fittrack-data";

describe("steps", () => {
  it("estimates km from steps for a 165 cm height", () => {
    expect(estimateKm(10000)).toBe(6.85);
    expect(estimateKm(0)).toBe(0);
  });
});

describe("body weight", () => {
  it("keeps two decimals like 62.85", () => {
    expect(roundWeight(62.85)).toBe(62.85);
    expect(roundWeight(62.854)).toBe(62.85);
  });
});

describe("sleep with dates", () => {
  it("Nov 17 2:00 AM to Nov 17 9:00 AM is 7 hours", () => {
    expect(sleepBetween("2026-11-17", "02:00", "2026-11-17", "09:00")).toBe(420);
  });
  it("Nov 16 11:30 PM to Nov 17 8:00 AM is 8.5 hours", () => {
    expect(sleepBetween("2026-11-16", "23:30", "2026-11-17", "08:00")).toBe(510);
  });
  it("rejects waking before falling asleep", () => {
    expect(sleepBetween("2026-11-17", "09:00", "2026-11-17", "02:00")).toBeNull();
  });
});

describe("core finisher", () => {
  it("uses Knee Tucks instead of Dead Bugs", () => {
    expect(coreFinisher.some((x) => x.startsWith("Knee Tucks"))).toBe(true);
    expect(coreFinisher.some((x) => x.startsWith("Dead Bugs"))).toBe(false);
  });
});

describe("routine changes", () => {
  it("moving an unfinished item puts it on the new day and time only", () => {
    const changes = { "2026-11-18": { "coding-1": { action: "move" as const, toDate: "2026-11-19", toTime: "15:30" } } };
    expect(routineForDate("2026-11-18", defaultRoutine, changes).some((i) => i.title === "Coding session 1")).toBe(false);
    const moved = routineForDate("2026-11-19", defaultRoutine, changes).filter((i) => i.title === "Coding session 1");
    expect(moved.map((i) => i.time).sort()).toEqual(["09:00", "15:30"]);
  });
  it("skipping removes the item for that day", () => {
    const changes = { "2026-11-18": { reading: { action: "skip" as const } } };
    expect(routineForDate("2026-11-18", defaultRoutine, changes).some((i) => i.id === "reading")).toBe(false);
  });
});

describe("routine reminders", () => {
  it("9:00 coding session is due in the 8:45–9:00 window, not the next one", () => {
    expect(dueRoutineItems("2026-11-18", 8 * 60 + 45, 9 * 60, defaultRoutine).map((i) => i.title)).toEqual(["Coding session 1"]);
    expect(dueRoutineItems("2026-11-18", 9 * 60, 9 * 60 + 15, defaultRoutine)).toEqual([]);
  });
  it("11:00 break and 11:30 coding session 2 each get their own reminder", () => {
    expect(dueRoutineItems("2026-11-18", 10 * 60 + 45, 11 * 60, defaultRoutine).map((i) => i.title)).toEqual(["Break"]);
    expect(dueRoutineItems("2026-11-18", 11 * 60 + 15, 11 * 60 + 30, defaultRoutine).map((i) => i.title)).toEqual(["Coding session 2"]);
  });
});

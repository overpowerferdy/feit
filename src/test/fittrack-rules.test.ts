import { describe, expect, it } from "vitest";
import { canAddPurchase, sleepMinutes } from "@/lib/fittrack-data";

describe("FitTrack rules", () => {
  it("blocks food spending over ₱100 in one Monday-start week", () => {
    const entries = [{ id: "1", date: "2026-11-16", item: "Eggs", amount: 80 }];
    expect(canAddPurchase(entries, "2026-11-18", 20)).toBe(true);
    expect(canAddPurchase(entries, "2026-11-18", 21)).toBe(false);
    expect(canAddPurchase(entries, "2026-11-23", 100)).toBe(true);
  });
  it("counts midnight to 8 AM as 8 hours", () => {
    expect(sleepMinutes("00:00", "08:00")).toBe(480);
  });
});

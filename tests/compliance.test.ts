import { describe, expect, it } from "vitest";
import { scanTextForCompliance } from "@/lib/compliance";

describe("scanTextForCompliance", () => {
  it("passes conditional aggregate copy", () => {
    const result = scanTextForCompliance("Your profile could align with a court archetype.");
    expect(result.ok).toBe(true);
  });

  it("flags direct athlete-matching language", () => {
    const result = scanTextForCompliance("You are most like a former Olympian.");
    expect(result.ok).toBe(false);
  });
});

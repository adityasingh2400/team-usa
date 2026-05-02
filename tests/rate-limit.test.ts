import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimitForTests } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });

  it("allows requests until the bucket limit is reached", () => {
    expect(checkRateLimit("ip", { limit: 2, windowMs: 1000, now: 0 }).allowed).toBe(true);
    expect(checkRateLimit("ip", { limit: 2, windowMs: 1000, now: 1 }).allowed).toBe(true);

    const blocked = checkRateLimit("ip", { limit: 2, windowMs: 1000, now: 2 });

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets the bucket after the window", () => {
    expect(checkRateLimit("ip", { limit: 1, windowMs: 1000, now: 0 }).allowed).toBe(true);
    expect(checkRateLimit("ip", { limit: 1, windowMs: 1000, now: 1001 }).allowed).toBe(true);
  });
});

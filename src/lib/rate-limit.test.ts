import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("blocks once the window is full and allows a later request", () => {
    const store = new Map<string, number[]>();
    const first = rateLimit({ key: "ip", limit: 2, windowMs: 1_000, now: 1_000, store });
    const second = rateLimit({ key: "ip", limit: 2, windowMs: 1_000, now: 1_100, store });
    const blocked = rateLimit({ key: "ip", limit: 2, windowMs: 1_000, now: 1_200, store });
    const later = rateLimit({ key: "ip", limit: 2, windowMs: 1_000, now: 2_200, store });

    expect(first.ok).toBe(true);
    expect(second.remaining).toBe(0);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(later.ok).toBe(true);
  });
});

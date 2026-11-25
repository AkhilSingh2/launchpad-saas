import { describe, expect, it } from "vitest";
import { canAcceptSeat, canCreateLaunch, canInviteSeat, formatCap } from "@/lib/plans";

describe("plans", () => {
  it("gates free launches and seats", () => {
    expect(canCreateLaunch("free", 0)).toBe(true);
    expect(canCreateLaunch("free", 1)).toBe(false);
    expect(canInviteSeat("free", 2, 0)).toBe(true);
    expect(canInviteSeat("free", 2, 1)).toBe(false);
    expect(canAcceptSeat("free", 2)).toBe(true);
    expect(canAcceptSeat("free", 3)).toBe(false);
  });

  it("treats team limits as unbounded", () => {
    expect(canCreateLaunch("team", 400)).toBe(true);
    expect(formatCap(Number.POSITIVE_INFINITY)).toBe("Unlimited");
    expect(formatCap(10)).toBe("10");
  });
});

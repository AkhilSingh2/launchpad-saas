import { describe, expect, it } from "vitest";
import { inviteIsOpen } from "@/lib/invites";
import { safeNextPath, slugify } from "@/lib/slug";

describe("invites and paths", () => {
  it("rejects expired or accepted invites", () => {
    const now = new Date("2026-01-10T00:00:00Z");
    expect(inviteIsOpen({ status: "pending", expiresAt: new Date("2026-01-11T00:00:00Z") }, now)).toBe(true);
    expect(inviteIsOpen({ status: "pending", expiresAt: new Date("2026-01-09T00:00:00Z") }, now)).toBe(false);
    expect(inviteIsOpen({ status: "accepted", expiresAt: new Date("2026-01-11T00:00:00Z") }, now)).toBe(false);
  });

  it("only allows same-origin relative redirects", () => {
    expect(safeNextPath("/app/billing")).toBe("/app/billing");
    expect(safeNextPath("https://evil.example")).toBe("/app");
    expect(safeNextPath("//evil.example")).toBe("/app");
    expect(slugify("Akhilendra Singh")).toBe("akhilendra-singh");
  });
});

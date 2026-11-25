import { describe, expect, it } from "vitest";
import { assignableRoles, can, canRemoveMember } from "@/lib/rbac";

describe("rbac", () => {
  it("lets every role create a launch and only owners delete an organisation", () => {
    expect(can("member", "launch:create")).toBe(true);
    expect(can("member", "launch:delete")).toBe(false);
    expect(can("admin", "org:delete")).toBe(false);
    expect(can("owner", "org:delete")).toBe(true);
    expect(can("member", "audit:read")).toBe(false);
    expect(can("admin", "audit:read")).toBe(true);
    expect(can("member", "billing:manage")).toBe(false);
  });

  it("stops admins from removing owners or other admins", () => {
    expect(canRemoveMember("admin", "member", false)).toBe(true);
    expect(canRemoveMember("admin", "admin", false)).toBe(false);
    expect(canRemoveMember("owner", "admin", false)).toBe(true);
    expect(canRemoveMember("owner", "owner", false)).toBe(false);
    expect(canRemoveMember("owner", "member", true)).toBe(false);
  });

  it("reserves role assignment for the owner", () => {
    expect(assignableRoles("owner")).toEqual(["owner", "admin", "member"]);
    expect(assignableRoles("admin")).toEqual([]);
  });
});

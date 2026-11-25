export const ROLES = ["owner", "admin", "member"] as const;
export type Role = (typeof ROLES)[number];

export const ACTIONS = [
  "org:update",
  "org:delete",
  "member:invite",
  "member:remove",
  "member:role",
  "billing:manage",
  "launch:create",
  "launch:update",
  "launch:delete",
  "audit:read",
] as const;

export type Action = (typeof ACTIONS)[number];

const matrix: Record<Action, readonly Role[]> = {
  "org:update": ["owner", "admin"],
  "org:delete": ["owner"],
  "member:invite": ["owner", "admin"],
  "member:remove": ["owner", "admin"],
  "member:role": ["owner"],
  "billing:manage": ["owner", "admin"],
  "launch:create": ["owner", "admin", "member"],
  "launch:update": ["owner", "admin", "member"],
  "launch:delete": ["owner", "admin"],
  "audit:read": ["owner", "admin"],
};

export function isRole(value: string | null | undefined): value is Role {
  return value === "owner" || value === "admin" || value === "member";
}

export function can(role: Role, action: Action) {
  return matrix[action].includes(role);
}

export class PermissionError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
    this.name = "PermissionError";
  }
}

export function assertCan(role: Role, action: Action) {
  if (!can(role, action)) throw new PermissionError();
}

export function canRemoveMember(actor: Role, target: Role, samePerson: boolean) {
  if (samePerson || target === "owner") return false;
  if (actor === "owner") return true;
  return actor === "admin" && target === "member";
}

export function assignableRoles(actor: Role): Role[] {
  if (actor !== "owner") return [];
  return ["owner", "admin", "member"];
}

export function isPlatformAdmin(platformRole: string | null | undefined) {
  return platformRole === "admin";
}

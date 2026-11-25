export const PLAN_IDS = ["free", "pro", "team"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceMonthly: number;
  launches: number;
  seats: number;
  description: string;
  features: string[];
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    launches: 1,
    seats: 3,
    description: "For a single launch and a small crew.",
    features: ["1 active launch", "3 seats", "Audit log", "Email invites"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 29,
    launches: 10,
    seats: 15,
    description: "For a product team that ships every month.",
    features: ["10 launches", "15 seats", "Role changes", "Billing portal"],
  },
  team: {
    id: "team",
    name: "Team",
    priceMonthly: 79,
    launches: Number.POSITIVE_INFINITY,
    seats: Number.POSITIVE_INFINITY,
    description: "For several products under one organisation.",
    features: ["Unlimited launches", "Unlimited seats", "Priority audit history", "Shared billing"],
  },
};

export function isPlanId(value: string | null | undefined): value is PlanId {
  return value === "free" || value === "pro" || value === "team";
}

export function planOf(value: string | null | undefined): PlanId {
  return isPlanId(value) ? value : "free";
}

export function canCreateLaunch(plan: PlanId, launchCount: number) {
  return launchCount < PLANS[plan].launches;
}

export function canInviteSeat(plan: PlanId, memberCount: number, pendingInvites: number) {
  return memberCount + pendingInvites < PLANS[plan].seats;
}

export function canAcceptSeat(plan: PlanId, memberCount: number) {
  return memberCount < PLANS[plan].seats;
}

export function formatCap(limit: number) {
  return Number.isFinite(limit) ? String(limit) : "Unlimited";
}

export function usagePercent(used: number, limit: number) {
  if (!Number.isFinite(limit) || limit <= 0) return Math.min(100, used * 8);
  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
}

import { and, count, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { invitations, launches, members, organizations } from "@/db/schema";
import { isPlanId, planOf, type PlanId } from "@/lib/plans";
import { isRole, type Role } from "@/lib/rbac";

export const ORG_COOKIE = "lp_org";

export async function getOrgContext(userId: string) {
  const rows = await db
    .select({
      memberId: members.id,
      role: members.role,
      organizationId: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      plan: organizations.plan,
      subscriptionStatus: organizations.subscriptionStatus,
      stripeCustomerId: organizations.stripeCustomerId,
      stripeSubscriptionId: organizations.stripeSubscriptionId,
    })
    .from(members)
    .innerJoin(organizations, eq(members.organizationId, organizations.id))
    .where(eq(members.userId, userId));

  if (rows.length === 0) return null;

  const preferred = (await cookies()).get(ORG_COOKIE)?.value;
  const current =
    rows.find((row) => row.organizationId === preferred) ??
    rows.find((row) => row.slug === "northstar") ??
    rows[0];

  return { current, orgs: rows };
}

export async function getUsage(organizationId: string) {
  const [launchRow] = await db
    .select({ value: count() })
    .from(launches)
    .where(eq(launches.organizationId, organizationId));
  const [memberRow] = await db
    .select({ value: count() })
    .from(members)
    .where(eq(members.organizationId, organizationId));
  const [inviteRow] = await db
    .select({ value: count() })
    .from(invitations)
    .where(and(eq(invitations.organizationId, organizationId), eq(invitations.status, "pending")));

  return {
    launches: Number(launchRow?.value ?? 0),
    members: Number(memberRow?.value ?? 0),
    pendingInvites: Number(inviteRow?.value ?? 0),
  };
}

export function roleOf(value: string): Role {
  return isRole(value) ? value : "member";
}

export function orgPlan(value: string): PlanId {
  return isPlanId(value) ? planOf(value) : "free";
}

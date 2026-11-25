import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { members, organizations, user, webhookEvents } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import {
  reduceBillingEvent,
  type BillingState,
  type NormalizedBillingEvent,
} from "@/lib/billing-events";
import { sendBillingEmail } from "@/lib/email";
import { planOf } from "@/lib/plans";

function stateOf(org: {
  plan: string;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}): BillingState {
  return {
    plan: planOf(org.plan),
    subscriptionStatus: org.subscriptionStatus,
    stripeCustomerId: org.stripeCustomerId,
    stripeSubscriptionId: org.stripeSubscriptionId,
  };
}

export async function persistBillingEvent(
  orgId: string,
  event: NormalizedBillingEvent,
  actorId?: string | null,
) {
  const outcome = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(webhookEvents)
      .values({ id: event.id, type: event.type })
      .onConflictDoNothing()
      .returning({ id: webhookEvents.id });

    if (inserted.length === 0) return { status: "duplicate" as const };

    const [org] = await tx.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    if (!org) return { status: "ignored" as const };

    const reduced = reduceBillingEvent(new Set(), stateOf(org), event);
    if (reduced.status !== "applied") return { status: reduced.status };

    await tx
      .update(organizations)
      .set({
        plan: reduced.next.plan,
        subscriptionStatus: reduced.next.subscriptionStatus,
        stripeCustomerId: reduced.next.stripeCustomerId,
        stripeSubscriptionId: reduced.next.stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));

    return {
      status: "applied" as const,
      plan: reduced.next.plan,
      previous: org.plan,
      orgName: org.name,
    };
  });

  if (outcome.status !== "applied") return outcome;

  await writeAudit({
    organizationId: orgId,
    actorId: actorId ?? null,
    action: "billing.plan_changed",
    targetType: "organization",
    targetId: orgId,
    metadata: { from: outcome.previous, to: outcome.plan, event: event.type },
  });

  const [owner] = await db
    .select({ email: user.email })
    .from(members)
    .innerJoin(user, eq(members.userId, user.id))
    .where(and(eq(members.organizationId, orgId), eq(members.role, "owner")))
    .limit(1);

  if (owner) {
    try {
      await sendBillingEmail(owner.email, outcome.orgName, outcome.plan);
    } catch (error) {
      console.error("billing email failed", error);
    }
  }

  return outcome;
}

export async function findOrgBySubscription(subscriptionId: string) {
  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.stripeSubscriptionId, subscriptionId))
    .limit(1);
  return org?.id ?? null;
}

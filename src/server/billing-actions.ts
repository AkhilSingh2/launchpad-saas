"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { persistBillingEvent } from "@/lib/billing";
import { isPlanId, type PlanId } from "@/lib/plans";
import { PermissionError } from "@/lib/rbac";
import { appBaseUrl, getStripe, stripeCheckoutConfigured } from "@/lib/stripe";
import { errorRedirect, noticeRedirect, requirePermission } from "@/server/context";

function paidPlan(value: string): PlanId | null {
  return value === "pro" || value === "team" ? value : null;
}

export async function startCheckout(formData: FormData) {
  try {
    const { org, user } = await requirePermission("billing:manage");
    const plan = paidPlan(String(formData.get("plan") ?? ""));
    if (!plan) errorRedirect("/app/billing", "Choose Pro or Team.");
    if (org.plan === plan && org.subscriptionStatus === "active") {
      noticeRedirect("/app/billing", `You are already on ${plan}.`);
    }

    if (!stripeCheckoutConfigured()) {
      redirect(`/app/billing/checkout?plan=${plan}`);
    }

    const stripe = getStripe();
    let customerId = org.stripeCustomerId;
    if (!customerId || customerId.startsWith("stub_")) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: { orgId: org.organizationId },
      });
      customerId = customer.id;
      await db
        .update(organizations)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(organizations.id, org.organizationId));
    }

    const price = plan === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_TEAM;
    if (!price) errorRedirect("/app/billing", "Stripe price ids are missing.");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: org.organizationId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${appBaseUrl()}/app/billing?notice=Checkout+complete.+Waiting+for+the+webhook.`,
      cancel_url: `${appBaseUrl()}/app/billing?error=Checkout+canceled.`,
      metadata: { orgId: org.organizationId, plan },
      subscription_data: { metadata: { orgId: org.organizationId, plan } },
    });
    if (!session.url) errorRedirect("/app/billing", "Stripe did not return a checkout URL.");
    redirect(session.url);
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/billing", error.message);
    throw error;
  }
}

export async function confirmStubCheckout(formData: FormData) {
  try {
    const { org, user } = await requirePermission("billing:manage");
    const plan = paidPlan(String(formData.get("plan") ?? ""));
    if (!plan || !isPlanId(plan)) errorRedirect("/app/billing", "Choose Pro or Team.");
    const subscriptionId = org.stripeSubscriptionId?.startsWith("stub_")
      ? org.stripeSubscriptionId
      : `stub_sub_${org.organizationId.slice(0, 8)}`;
    const customerId = org.stripeCustomerId?.startsWith("cus_")
      ? org.stripeCustomerId
      : `stub_cus_${org.organizationId.slice(0, 8)}`;

    await persistBillingEvent(
      org.organizationId,
      {
        id: `stub_evt_${crypto.randomUUID()}`,
        type: "checkout.session.completed",
        orgId: org.organizationId,
        plan,
        customerId,
        subscriptionId,
      },
      user.id,
    );
    noticeRedirect("/app/billing", `Local checkout confirmed. ${org.name} is on ${plan}.`);
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/billing", error.message);
    throw error;
  }
}

export async function openBillingPortal() {
  try {
    const { org } = await requirePermission("billing:manage");
    if (!stripeCheckoutConfigured() || !org.stripeCustomerId || org.stripeCustomerId.startsWith("stub_")) {
      redirect("/app/billing?notice=Stripe+portal+is+unavailable+without+live+keys.+Use+the+plan+controls+here.");
    }
    const session = await getStripe().billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${appBaseUrl()}/app/billing`,
    });
    redirect(session.url);
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/billing", error.message);
    throw error;
  }
}

export async function cancelStubSubscription() {
  try {
    const { org, user } = await requirePermission("billing:manage");
    if (org.plan === "free") noticeRedirect("/app/billing", "This organisation is already on Free.");
    if (org.stripeSubscriptionId && !org.stripeSubscriptionId.startsWith("stub_") && stripeCheckoutConfigured()) {
      errorRedirect("/app/billing", "Cancel the live subscription from the Stripe portal.");
    }
    await persistBillingEvent(
      org.organizationId,
      {
        id: `stub_evt_${crypto.randomUUID()}`,
        type: "customer.subscription.deleted",
        orgId: org.organizationId,
        subscriptionId: org.stripeSubscriptionId ?? "stub",
      },
      user.id,
    );
    noticeRedirect("/app/billing", "Subscription canceled. You are back on Free.");
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/billing", error.message);
    throw error;
  }
}

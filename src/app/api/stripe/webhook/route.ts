import { NextResponse } from "next/server";
import { findOrgBySubscription, persistBillingEvent } from "@/lib/billing";
import { toBillingEvent } from "@/lib/billing-events";
import { getStripe, stripeConfigured, stripePriceIds } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const body = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const normalized = toBillingEvent(event, stripePriceIds());
  let orgId: string | null = null;
  if (normalized.type === "checkout.session.completed") orgId = normalized.orgId;
  if (normalized.type === "customer.subscription.updated" || normalized.type === "customer.subscription.deleted") {
    orgId = normalized.orgId ?? (normalized.subscriptionId ? await findOrgBySubscription(normalized.subscriptionId) : null);
  }

  if (!orgId || normalized.type === "ignored") {
    return NextResponse.json({ received: true, status: "ignored" });
  }

  const result = await persistBillingEvent(orgId, normalized);
  return NextResponse.json({ received: true, status: result.status });
}

import { describe, expect, it } from "vitest";
import { planFromPriceId, reduceBillingEvent, toBillingEvent, type BillingState } from "@/lib/billing-events";

const free: BillingState = {
  plan: "free",
  subscriptionStatus: "none",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

describe("billing events", () => {
  it("maps a checkout session onto the organisation in metadata", () => {
    const event = toBillingEvent(
      {
        id: "evt_1",
        type: "checkout.session.completed",
        data: {
          object: {
            mode: "subscription",
            customer: "cus_1",
            subscription: "sub_1",
            metadata: { orgId: "org_1", plan: "pro" },
          },
        },
      },
      { pro: "price_pro", team: "price_team" },
    );
    expect(event.type).toBe("checkout.session.completed");
    if (event.type !== "checkout.session.completed") return;
    const applied = reduceBillingEvent(new Set(), free, event);
    expect(applied).toMatchObject({
      status: "applied",
      next: { plan: "pro", stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_1" },
    });
  });

  it("ignores a repeated event id", () => {
    const event = toBillingEvent(
      {
        id: "evt_2",
        type: "customer.subscription.deleted",
        data: { object: { id: "sub_1", metadata: { orgId: "org_1" } } },
      },
      {},
    );
    const result = reduceBillingEvent(new Set(["evt_2"]), free, event);
    expect(result.status).toBe("duplicate");
  });

  it("resolves plan from the Stripe price id", () => {
    expect(planFromPriceId("price_team", { pro: "price_pro", team: "price_team" })).toBe("team");
    const event = toBillingEvent(
      {
        id: "evt_3",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_9",
            status: "past_due",
            metadata: { orgId: "org_1" },
            items: { data: [{ price: { id: "price_pro" } }] },
          },
        },
      },
      { pro: "price_pro" },
    );
    expect(event).toMatchObject({ type: "customer.subscription.updated", plan: "pro", status: "past_due" });
  });

  it("returns the organisation to free when the subscription is deleted", () => {
    const event = toBillingEvent(
      {
        id: "evt_4",
        type: "customer.subscription.deleted",
        data: { object: { id: "sub_1" } },
      },
      {},
    );
    const result = reduceBillingEvent(
      new Set(),
      { ...free, plan: "pro", subscriptionStatus: "active", stripeSubscriptionId: "sub_1" },
      event,
    );
    expect(result).toMatchObject({
      status: "applied",
      next: { plan: "free", subscriptionStatus: "canceled", stripeSubscriptionId: null },
    });
  });
});

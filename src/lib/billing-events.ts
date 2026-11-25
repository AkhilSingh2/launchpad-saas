import { isPlanId, type PlanId } from "@/lib/plans";

export type BillingState = {
  plan: PlanId;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export type NormalizedBillingEvent =
  | {
      id: string;
      type: "checkout.session.completed";
      orgId: string;
      plan: PlanId;
      customerId: string | null;
      subscriptionId: string | null;
    }
  | {
      id: string;
      type: "customer.subscription.updated";
      orgId: string | null;
      subscriptionId: string;
      plan: PlanId | null;
      status: string;
    }
  | {
      id: string;
      type: "customer.subscription.deleted";
      orgId: string | null;
      subscriptionId: string;
    }
  | { id: string; type: "ignored" };

export type StripeEventLike = {
  id: string;
  type: string;
  data: { object: unknown };
};

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function text(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function idOf(value: unknown) {
  if (typeof value === "string") return text(value);
  return text(record(value)?.id);
}

function priceIdFromSubscription(object: Record<string, unknown>) {
  const items = record(object.items);
  const data = items?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = record(data[0]);
  const price = first?.price;
  if (typeof price === "string") return price;
  return text(record(price)?.id);
}

export function planFromPriceId(
  priceId: string | null,
  prices: { pro?: string; team?: string },
): PlanId | null {
  if (!priceId) return null;
  if (prices.pro && priceId === prices.pro) return "pro";
  if (prices.team && priceId === prices.team) return "team";
  return null;
}

export function toBillingEvent(
  event: StripeEventLike,
  prices: { pro?: string; team?: string },
): NormalizedBillingEvent {
  const object = record(event.data?.object);
  if (!object) return { id: event.id, type: "ignored" };

  if (event.type === "checkout.session.completed") {
    if (object.mode && object.mode !== "subscription") return { id: event.id, type: "ignored" };
    const metadata = record(object.metadata);
    const orgId = text(metadata?.orgId);
    const plan = text(metadata?.plan);
    if (!orgId || !isPlanId(plan) || plan === "free") return { id: event.id, type: "ignored" };
    return {
      id: event.id,
      type: "checkout.session.completed",
      orgId,
      plan,
      customerId: idOf(object.customer),
      subscriptionId: idOf(object.subscription),
    };
  }

  if (event.type === "customer.subscription.updated") {
    const metadata = record(object.metadata);
    const pricePlan = planFromPriceId(priceIdFromSubscription(object), prices);
    const metaPlan = text(metadata?.plan);
    const plan = pricePlan ?? (isPlanId(metaPlan) ? metaPlan : null);
    return {
      id: event.id,
      type: "customer.subscription.updated",
      orgId: text(metadata?.orgId),
      subscriptionId: text(object.id) ?? "",
      plan,
      status: text(object.status) ?? "active",
    };
  }

  if (event.type === "customer.subscription.deleted") {
    const metadata = record(object.metadata);
    return {
      id: event.id,
      type: "customer.subscription.deleted",
      orgId: text(metadata?.orgId),
      subscriptionId: text(object.id) ?? "",
    };
  }

  return { id: event.id, type: "ignored" };
}

export function reduceBillingEvent(
  seen: ReadonlySet<string>,
  state: BillingState,
  event: NormalizedBillingEvent,
):
  | { status: "duplicate" }
  | { status: "ignored" }
  | { status: "applied"; next: BillingState } {
  if (seen.has(event.id)) return { status: "duplicate" };
  if (event.type === "ignored") return { status: "ignored" };

  if (event.type === "checkout.session.completed") {
    return {
      status: "applied",
      next: {
        plan: event.plan,
        subscriptionStatus: "active",
        stripeCustomerId: event.customerId ?? state.stripeCustomerId,
        stripeSubscriptionId: event.subscriptionId ?? state.stripeSubscriptionId,
      },
    };
  }

  if (event.type === "customer.subscription.updated") {
    if (!event.plan || !event.subscriptionId) return { status: "ignored" };
    return {
      status: "applied",
      next: {
        ...state,
        plan: event.plan,
        subscriptionStatus: event.status,
        stripeSubscriptionId: event.subscriptionId,
      },
    };
  }

  return {
    status: "applied",
    next: {
      ...state,
      plan: "free",
      subscriptionStatus: "canceled",
      stripeSubscriptionId: null,
    },
  };
}

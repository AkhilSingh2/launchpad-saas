import { Flash } from "@/components/flash";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { formatCap, PLANS, PLAN_IDS } from "@/lib/plans";
import { can } from "@/lib/rbac";
import { stripeCheckoutConfigured } from "@/lib/stripe";
import { getUsage } from "@/lib/tenant";
import { cancelStubSubscription, openBillingPortal, startCheckout } from "@/server/billing-actions";
import { requireWorkspace } from "@/server/context";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const { org, role, plan } = await requireWorkspace();
  const usage = await getUsage(org.organizationId);
  const manage = can(role, "billing:manage");
  const live = stripeCheckoutConfigured();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Subscription"
        title="Billing"
        description={
          live
            ? "Checkout and the customer portal use your Stripe test keys. Webhooks update the plan."
            : "Stripe keys are not set, so upgrades confirm through the local checkout stub."
        }
      />
      <Flash error={query.error} notice={query.notice} />
      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Current plan</p>
          <p className="mt-2 font-display text-4xl capitalize">{plan}</p>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{org.subscriptionStatus}</p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Launches</p>
          <p className="mt-2 font-display text-4xl tabular-nums">
            {usage.launches}
            <span className="text-lg text-muted-foreground"> / {formatCap(PLANS[plan].launches)}</span>
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Seats</p>
          <p className="mt-2 font-display text-4xl tabular-nums">
            {usage.members + usage.pendingInvites}
            <span className="text-lg text-muted-foreground"> / {formatCap(PLANS[plan].seats)}</span>
          </p>
        </article>
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_IDS.map((id) => {
          const item = PLANS[id];
          const current = id === plan;
          return (
            <article key={id} className={`rounded-2xl border p-5 ${current ? "border-foreground" : "border-border"}`}>
              <p className="text-sm">{item.name}</p>
              <p className="mt-2 font-display text-4xl">{formatMoney(item.priceMonthly)}</p>
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                <li>{formatCap(item.launches)} launches</li>
                <li>{formatCap(item.seats)} seats</li>
              </ul>
              {manage && id !== "free" ? (
                <form action={startCheckout} className="mt-5">
                  <input type="hidden" name="plan" value={id} />
                  <Button type="submit" variant={current ? "outline" : "default"} disabled={current}>
                    {current ? "Current plan" : live ? `Upgrade to ${item.name}` : `Try ${item.name} locally`}
                  </Button>
                </form>
              ) : (
                <p className="mt-5 text-sm text-muted-foreground">
                  {current ? "Current plan" : manage ? "Use cancel to return to Free." : "Ask an admin to change plan."}
                </p>
              )}
            </article>
          );
        })}
      </div>
      {manage ? (
        <div className="flex flex-wrap gap-3">
          <form action={openBillingPortal}>
            <Button type="submit" variant="outline">
              {live && org.stripeCustomerId && !org.stripeCustomerId.startsWith("stub_")
                ? "Open Stripe portal"
                : "Billing portal"}
            </Button>
          </form>
          {plan !== "free" ? (
            <form action={cancelStubSubscription}>
              <Button type="submit" variant="ghost">
                Cancel subscription
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

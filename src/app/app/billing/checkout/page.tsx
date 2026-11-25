import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isPlanId, PLANS } from "@/lib/plans";
import { formatMoney } from "@/lib/format";
import { stripeCheckoutConfigured } from "@/lib/stripe";
import { confirmStubCheckout } from "@/server/billing-actions";
import { requirePermission } from "@/server/context";

export default async function StubCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  await requirePermission("billing:manage");
  const query = await searchParams;
  const plan = query.plan && isPlanId(query.plan) && query.plan !== "free" ? query.plan : null;
  if (!plan) redirect("/app/billing");
  if (stripeCheckoutConfigured()) redirect("/app/billing");

  return (
    <div className="mx-auto max-w-md space-y-5">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Local checkout</p>
      <h1 className="font-display text-4xl">Confirm {PLANS[plan].name}</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        No card is charged. This stub writes the subscription the same way a signed Stripe webhook would, including the idempotency row and the audit entry.
      </p>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Test card</p>
        <p className="mt-1 font-mono text-lg">4242 4242 4242 4242</p>
        <p className="mt-4 font-display text-4xl">{formatMoney(PLANS[plan].priceMonthly)}<span className="font-sans text-base text-muted-foreground">/mo</span></p>
      </div>
      <form action={confirmStubCheckout}>
        <input type="hidden" name="plan" value={plan} />
        <Button type="submit" data-testid="confirm-stub-checkout">
          Confirm test payment
        </Button>
      </form>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { formatCap, PLANS, PLAN_IDS } from "@/lib/plans";

export const metadata: Metadata = { title: "Pricing" };

const faqs = [
  {
    q: "Do I need a Stripe account to try this?",
    a: "No. Without STRIPE_SECRET_KEY the upgrade button opens a local checkout. Confirming it writes the same plan change, audit row, and billing email as a webhook would.",
  },
  {
    q: "Where are the limits enforced?",
    a: "In the server action, before the insert. The pricing page is a promise. The database write is the check.",
  },
  {
    q: "Can a member change the plan?",
    a: "No. Billing is limited to owners and admins. Members can still read the current plan.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="content" className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">Pricing</p>
        <h1 className="mt-3 max-w-2xl font-display text-5xl tracking-tight">A plan for the size of the launch.</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Prices are monthly test-mode figures. The Free plan is enough to walk the product. Pro and Team are what the checkout stub unlocks.
        </p>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {PLAN_IDS.map((id) => {
            const plan = PLANS[id];
            const featured = id === "pro";
            return (
              <article
                key={id}
                className={`flex flex-col rounded-3xl border p-6 ${featured ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
              >
                <p className="text-sm">{plan.name}</p>
                <p className="mt-3 font-display text-5xl">
                  {formatMoney(plan.priceMonthly)}
                  <span className="text-base font-sans">/mo</span>
                </p>
                <p className={`mt-3 text-sm ${featured ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
                <ul className="mt-6 space-y-2 text-sm">
                  <li>{formatCap(plan.launches)} launches</li>
                  <li>{formatCap(plan.seats)} seats</li>
                  {plan.features.slice(2).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Button asChild className="mt-8" variant={featured ? "secondary" : "default"}>
                  <Link href="/signup">{id === "free" ? "Start free" : `Choose ${plan.name}`}</Link>
                </Button>
              </article>
            );
          })}
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {faqs.map((item) => (
            <div key={item.q}>
              <h2 className="font-medium">{item.q}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

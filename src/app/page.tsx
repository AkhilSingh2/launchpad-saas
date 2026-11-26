import Link from "next/link";
import { HeroMotion } from "@/components/marketing/hero-motion";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { demoMode } from "@/lib/demo";

const pillars = [
  {
    title: "Tenancy that stays put",
    copy: "Every launch, invite, and audit row is scoped to an organisation. The id in the URL is never trusted on its own.",
  },
  {
    title: "Roles on the server",
    copy: "Owner, admin, and member are checked inside the action that writes data. Hiding a button is not the control.",
  },
  {
    title: "Billing with a stub",
    copy: "Stripe checkout, portal, and signed webhooks when keys exist. A local checkout confirms the same plan change when they do not.",
  },
];

const steps = [
  { n: "01", title: "Open a pad", copy: "Email and password work immediately. GitHub and Google appear once their keys are set." },
  { n: "02", title: "Invite the crew", copy: "Owners and admins send a seven-day invite. Seats are counted before the email goes out." },
  { n: "03", title: "Ship the list", copy: "A free organisation gets one launch. Pro and Team raise the ceiling, and the audit log keeps the story." },
];

export default function HomePage() {
  const demoHref = demoMode() ? "/demo" : "/login";
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(ellipse_at_top,rgba(194,65,12,0.16),transparent_58%)]" />
      <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-[42rem]" />
      <SiteHeader />
      <main id="content">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <HeroMotion>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Mission control for product launches</p>
              <h1 className="mt-4 max-w-xl font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
                Ship the launch. Keep the record.
              </h1>
            </HeroMotion>
            <HeroMotion delay={0.08}>
              <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
                LaunchPad is the workspace for the week a product goes out: the checklist, the people allowed to change it, and the plan that gates the work.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/signup">Start a free pad</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={demoHref}>{demoMode() ? "Try the demo" : "Open the demo"}</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {demoMode()
                  ? "One click signs you in as the Northstar owner. No account needed."
                  : "Seeded accounts. No Stripe or Resend key required."}
              </p>
            </HeroMotion>
          </div>
          <HeroMotion delay={0.12}>
            <div className="rounded-[1.6rem] border border-border bg-card p-3 shadow-[0_30px_80px_-40px_rgba(26,23,20,0.45)]">
              <div className="rounded-[1.2rem] border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Northstar</p>
                    <p className="font-display text-2xl">Public beta</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs">Ready</span>
                </div>
                <ul className="mt-5 space-y-2 text-sm">
                  {["Freeze the API", "Write the launch note", "Confirm billing copy"].map((item, index) => (
                    <li key={item} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
                      <span className={`size-2.5 rounded-full ${index === 2 ? "bg-border" : "bg-accent"}`} />
                      <span className={index === 2 ? "text-muted-foreground" : ""}>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-secondary px-2 py-3">
                    <p className="font-display text-lg">3</p>
                    <p className="text-muted-foreground">Launches</p>
                  </div>
                  <div className="rounded-xl bg-secondary px-2 py-3">
                    <p className="font-display text-lg">4</p>
                    <p className="text-muted-foreground">Seats</p>
                  </div>
                  <div className="rounded-xl bg-secondary px-2 py-3">
                    <p className="font-display text-lg">Pro</p>
                    <p className="text-muted-foreground">Plan</p>
                  </div>
                </div>
              </div>
            </div>
          </HeroMotion>
        </section>

        <section id="product" className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-display text-2xl">{pillar.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{pillar.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-4xl tracking-tight">How a launch week runs</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="rounded-2xl border border-border p-5">
                <p className="font-display text-accent">{step.n}</p>
                <h3 className="mt-2 text-lg font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="flex flex-col items-start justify-between gap-6 rounded-[1.6rem] bg-primary px-6 py-8 text-primary-foreground sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="font-display text-4xl">Bring the crew onto one pad.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/75">
                The demo opens on Northstar, already on Pro, with an owner, an admin, and a member.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary">
              <Link href={demoHref}>Enter the demo</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

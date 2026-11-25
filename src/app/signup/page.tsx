import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";
import { oauthProviders } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <main id="content" className="grid min-h-screen lg:grid-cols-2">
      <section className="flex items-center px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <Logo />
          <h1 className="mt-8 font-display text-4xl">Create your pad</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A free organisation is created with you as owner. Upgrade later, with Stripe or the local stub.
          </p>
          <div className="mt-8">
            <AuthForm mode="signup" github={oauthProviders.github} google={oauthProviders.google} />
          </div>
        </div>
      </section>
      <section className="hidden bg-[radial-gradient(circle_at_top_left,#ffd7c2,transparent_40%),linear-gradient(#1a1714,#1a1714)] lg:block" />
    </main>
  );
}

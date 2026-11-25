import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";
import { oauthProviders } from "@/lib/auth";
import { safeNextPath } from "@/lib/slug";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const query = await searchParams;
  return (
    <main id="content" className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Logo className="text-primary-foreground [&_rect]:fill-primary-foreground [&_circle]:fill-primary" />
        <div>
          <h1 className="max-w-md font-display text-5xl leading-tight">The demo is already staffed.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-primary-foreground/75">
            Akhil owns Northstar. Maya administers it. Jordan can ship checklist items and cannot read the audit log.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">Password for every demo account: launchpad</p>
      </section>
      <section className="flex items-center px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <h1 className="font-display text-4xl lg:hidden">Sign in</h1>
          <h2 className="hidden font-display text-4xl lg:block">Sign in</h2>
          <div className="mt-8">
            <AuthForm
              mode="login"
              next={safeNextPath(query.next)}
              github={oauthProviders.github}
              google={oauthProviders.google}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

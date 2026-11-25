import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            A portfolio-grade SaaS starter by{" "}
            <a className="underline decoration-border underline-offset-4" href="https://github.com/AkhilSingh2">
              Akhilendra Singh
            </a>
            . Auth, organisations, roles, and billing you can run with no paid keys.
          </p>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Demo</Link>
          <a href="https://github.com/AkhilSingh2/launchpad-saas">Source</a>
        </div>
      </div>
    </footer>
  );
}

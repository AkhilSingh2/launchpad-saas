"use client";

import {
  CreditCard,
  LayoutDashboard,
  Rocket,
  ScrollText,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { switchOrganization } from "@/server/org-actions";

const links = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/launches", label: "Launches", icon: Rocket },
  { href: "/app/team", label: "Team", icon: Users },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/audit", label: "Audit", icon: ScrollText },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  user,
  org,
  orgs,
  usage,
}: {
  children: ReactNode;
  user: { name: string; email: string; platformAdmin: boolean };
  org: { id: string; name: string; plan: string; role: string };
  orgs: { id: string; name: string; role: string }[];
  usage: { launches: string; seats: string };
}) {
  const pathname = usePathname();
  const router = useRouter();

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Workspace">
      {links.map((link) => {
        const active = pathname === link.href || (link.href !== "/app" && pathname.startsWith(link.href));
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
      {user.platformAdmin ? (
        <Link
          href="/admin"
          className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Shield className="size-4" aria-hidden="true" />
          Platform admin
        </Link>
      ) : null}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[16.5rem_1fr]">
      <aside className="hidden border-r border-border bg-card md:flex md:flex-col md:px-4 md:py-5">
        <Link href="/app" aria-label="LaunchPad overview">
          <Logo />
        </Link>
        <div className="mt-6">{nav}</div>
        <div className="mt-auto rounded-2xl border border-border bg-background p-3 text-sm">
          <p className="font-medium capitalize">{org.plan} plan</p>
          <p className="mt-1 text-muted-foreground">Launches {usage.launches}</p>
          <p className="text-muted-foreground">Seats {usage.seats}</p>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{org.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{org.role}</p>
          </div>
          <div className="flex items-center gap-2">
            <form action={switchOrganization} className="hidden items-center gap-2 sm:flex">
              <label htmlFor="organizationId" className="sr-only">
                Organisation
              </label>
              <select
                id="organizationId"
                name="organizationId"
                defaultValue={org.id}
                className="h-10 max-w-48 rounded-xl border border-input bg-card px-2 text-sm"
              >
                {orgs.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="outline" size="sm">
                Switch
              </Button>
            </form>
            <ThemeToggle />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={async () => {
                await authClient.signOut();
                router.push("/");
                router.refresh();
              }}
            >
              Sign out
            </Button>
          </div>
        </header>
        <details className="border-b border-border px-4 py-3 md:hidden">
          <summary className="cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <div className="pt-3">{nav}</div>
        </details>
        <main id="content" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

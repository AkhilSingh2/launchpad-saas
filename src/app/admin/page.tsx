import { count, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { auditLogs, members, organizations, user } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { isPlatformAdmin } from "@/lib/rbac";
import { requireSession } from "@/server/context";
import Link from "next/link";

export default async function AdminPage() {
  const session = await requireSession();
  if (!isPlatformAdmin(session.user.platformRole)) redirect("/app");

  const [userCount] = await db.select({ value: count() }).from(user);
  const [orgCount] = await db.select({ value: count() }).from(organizations);
  const [memberCount] = await db.select({ value: count() }).from(members);
  const people = await db.select().from(user).orderBy(desc(user.createdAt)).limit(20);
  const orgs = await db.select().from(organizations).orderBy(desc(organizations.createdAt)).limit(20);
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(8);

  return (
    <main id="content" className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <PageHeader eyebrow="Platform" title="Admin" description="Every organisation on this deployment. This page checks platformRole, not the org role." />
        <Link href="/app" className="text-sm underline underline-offset-4">
          Back to app
        </Link>
      </div>
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Users", userCount?.value ?? 0],
          ["Organisations", orgCount?.value ?? 0],
          ["Memberships", memberCount?.value ?? 0],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-4xl tabular-nums">{value}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-medium">People</h2>
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
            {people.map((person) => (
              <li key={person.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  <span className="block font-medium">{person.name}</span>
                  <span className="text-muted-foreground">{person.email}</span>
                </span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{person.platformRole ?? "user"}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-medium">Organisations</h2>
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
            {orgs.map((org) => (
              <li key={org.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  <span className="block font-medium">{org.name}</span>
                  <span className="text-muted-foreground">{org.slug}</span>
                </span>
                <span className="capitalize">{org.plan}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section>
        <h2 className="font-medium">Latest audit rows</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {logs.map((log) => (
            <li key={log.id} className="rounded-xl border border-border px-3 py-2">
              {log.action} · {formatDate(log.createdAt)}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

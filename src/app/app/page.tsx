import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, launches, user } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { daysUntil, formatDate } from "@/lib/format";
import { PLANS } from "@/lib/plans";
import { getUsage } from "@/lib/tenant";
import { requireWorkspace } from "@/server/context";

export default async function OverviewPage() {
  const { org, user: current, plan } = await requireWorkspace();
  const usage = await getUsage(org.organizationId);
  const launchRows = await db
    .select()
    .from(launches)
    .where(eq(launches.organizationId, org.organizationId))
    .orderBy(desc(launches.targetDate));
  const upcoming = launchRows.find((launch) => launch.status !== "launched" && launch.targetDate);
  const activity = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      createdAt: auditLogs.createdAt,
      actor: user.name,
    })
    .from(auditLogs)
    .leftJoin(user, eq(auditLogs.actorId, user.id))
    .where(eq(auditLogs.organizationId, org.organizationId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(5);

  const until = daysUntil(upcoming?.targetDate);
  const seatCap = Number.isFinite(PLANS[plan].seats) ? PLANS[plan].seats : "∞";
  const launchCap = Number.isFinite(PLANS[plan].launches) ? PLANS[plan].launches : "∞";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={org.name}
        title={`Good to see you, ${current.name.split(" ")[0]}.`}
        description={
          until === null
            ? "No dated launch is waiting. Add a target when the week is real."
            : until >= 0
              ? `${upcoming?.name} is ${until === 0 ? "today" : `in ${until} day${until === 1 ? "" : "s"}`}.`
              : `${upcoming?.name} was scheduled ${Math.abs(until)} days ago.`
        }
        action={
          <Button asChild>
            <Link href="/app/launches/new">New launch</Link>
          </Button>
        }
      />
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Launches", `${usage.launches} / ${launchCap}`],
          ["Seats", `${usage.members + usage.pendingInvites} / ${seatCap}`],
          ["Plan", plan],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-4xl capitalize tabular-nums">{value}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <h2 className="font-medium">Launches</h2>
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {launchRows.length === 0 ? (
              <li className="p-5 text-sm text-muted-foreground">No launches yet.</li>
            ) : (
              launchRows.map((launch) => (
                <li key={launch.id}>
                  <Link href={`/app/launches/${launch.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/60">
                    <span>
                      <span className="block font-medium">{launch.name}</span>
                      <span className="text-sm text-muted-foreground">{formatDate(launch.targetDate)}</span>
                    </span>
                    <Badge>{launch.status}</Badge>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h2 className="font-medium">Recent record</h2>
          <ul className="mt-3 space-y-3">
            {activity.length === 0 ? (
              <li className="text-sm text-muted-foreground">Nothing recorded yet.</li>
            ) : (
              activity.map((item) => (
                <li key={item.id} className="rounded-2xl border border-border px-4 py-3 text-sm">
                  <p className="font-medium">{item.action}</p>
                  <p className="text-muted-foreground">
                    {item.actor ?? "System"} · {formatDate(item.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

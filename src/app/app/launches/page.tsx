import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { Flash } from "@/components/flash";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { launches, launchTasks } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/rbac";
import { requireWorkspace } from "@/server/context";

export default async function LaunchesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const { org, role } = await requireWorkspace();
  const rows = await db
    .select()
    .from(launches)
    .where(eq(launches.organizationId, org.organizationId))
    .orderBy(desc(launches.createdAt));
  const tasks = rows.length
    ? await db
        .select()
        .from(launchTasks)
        .where(inArray(launchTasks.launchId, rows.map((row) => row.id)))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Checklist"
        title="Launches"
        description="Each launch belongs to this organisation. Creating one checks the plan limit first."
        action={
          can(role, "launch:create") ? (
            <Button asChild>
              <Link href="/app/launches/new">New launch</Link>
            </Button>
          ) : null
        }
      />
      <Flash error={query.error} notice={query.notice} />
      <ul className="grid gap-3">
        {rows.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">
            The pad is empty. The first launch is the one the Free plan allows.
          </li>
        ) : (
          rows.map((launch) => {
            const related = tasks.filter((task) => task.launchId === launch.id);
            const done = related.filter((task) => task.done).length;
            return (
              <li key={launch.id}>
                <Link href={`/app/launches/${launch.id}`} className="block rounded-2xl border border-border bg-card p-5 hover:border-foreground/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl">{launch.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{launch.summary || "No summary yet."}</p>
                    </div>
                    <Badge>{launch.status}</Badge>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {formatDate(launch.targetDate)} · {done}/{related.length} tasks
                  </p>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { Flash } from "@/components/flash";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/db";
import { launchTasks } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { can } from "@/lib/rbac";
import { launchInOrg, requireWorkspace } from "@/server/context";
import { addTask, deleteLaunch, toggleTask, updateLaunch } from "@/server/launch-actions";

export default async function LaunchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { org, role } = await requireWorkspace();
  const launch = await launchInOrg(id, org.organizationId);
  if (!launch) notFound();
  const tasks = await db
    .select()
    .from(launchTasks)
    .where(eq(launchTasks.launchId, launch.id))
    .orderBy(asc(launchTasks.position));
  const canEdit = can(role, "launch:update");
  const canDelete = can(role, "launch:delete");

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-4xl">{launch.name}</h1>
          <Badge>{launch.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{formatDate(launch.targetDate)}</p>
        <Flash error={query.error} notice={query.notice} />
        {canEdit ? (
          <form action={updateLaunch} className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <input type="hidden" name="launchId" value={launch.id} />
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={launch.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea id="summary" name="summary" defaultValue={launch.summary} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target date</Label>
                <Input id="targetDate" name="targetDate" type="date" defaultValue={launch.targetDate ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" name="status" defaultValue={launch.status} className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm">
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="launched">Launched</option>
                </select>
              </div>
            </div>
            <Button type="submit">Save launch</Button>
          </form>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">{launch.summary || "No summary yet."}</p>
        )}
        {canDelete ? (
          <form action={deleteLaunch}>
            <input type="hidden" name="launchId" value={launch.id} />
            <Button type="submit" variant="destructive">
              Delete launch
            </Button>
          </form>
        ) : null}
      </div>
      <section>
        <h2 className="font-medium">Checklist</h2>
        <ul className="mt-3 space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="rounded-xl border border-border bg-card">
              {canEdit ? (
                <form action={toggleTask}>
                  <input type="hidden" name="launchId" value={launch.id} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="done" value={task.done ? "false" : "true"} />
                  <button
                    type="submit"
                    role="checkbox"
                    aria-checked={task.done}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm"
                  >
                    <span className={`grid size-5 place-items-center rounded-md border ${task.done ? "border-accent bg-accent text-accent-foreground" : "border-input"}`}>
                      {task.done ? "✓" : ""}
                    </span>
                    <span className={task.done ? "text-muted-foreground line-through" : ""}>{task.title}</span>
                  </button>
                </form>
              ) : (
                <p className="px-3 py-3 text-sm">{task.title}</p>
              )}
            </li>
          ))}
        </ul>
        {canEdit ? (
          <form action={addTask} className="mt-4 flex gap-2">
            <input type="hidden" name="launchId" value={launch.id} />
            <Label htmlFor="title" className="sr-only">
              Task
            </Label>
            <Input id="title" name="title" placeholder="Add a task" required minLength={2} />
            <Button type="submit">Add</Button>
          </form>
        ) : null}
      </section>
    </div>
  );
}

import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { auditLogs, user } from "@/db/schema";
import { formatWhen } from "@/lib/format";
import { can } from "@/lib/rbac";
import { requireWorkspace } from "@/server/context";

export default async function AuditPage() {
  const { org, role } = await requireWorkspace();
  if (!can(role, "audit:read")) {
    return (
      <div className="max-w-xl space-y-3" data-testid="audit-forbidden">
        <PageHeader eyebrow="Record" title="Audit log" />
        <p className="rounded-2xl border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground">
          Owners and admins can read the audit log. Your role is member, so this list stays closed even if you open the URL directly.
        </p>
      </div>
    );
  }

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      createdAt: auditLogs.createdAt,
      metadata: auditLogs.metadata,
      actor: user.name,
    })
    .from(auditLogs)
    .leftJoin(user, eq(auditLogs.actorId, user.id))
    .where(eq(auditLogs.organizationId, org.organizationId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Record"
        title="Audit log"
        description="Writes from this organisation. The actor is the signed-in member, not a value from the form."
      />
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-secondary/70 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-4 py-3 whitespace-nowrap">{formatWhen(row.createdAt)}</td>
                <td className="px-4 py-3 font-medium">{row.action}</td>
                <td className="px-4 py-3">{row.actor ?? "System"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.metadata ? JSON.stringify(row.metadata) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

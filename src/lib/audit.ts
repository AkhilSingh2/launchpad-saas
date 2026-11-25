import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function writeAudit(entry: {
  organizationId: string;
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
}) {
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    organizationId: entry.organizationId,
    actorId: entry.actorId ?? null,
    action: entry.action,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    metadata: entry.metadata ?? null,
    ...(entry.createdAt ? { createdAt: entry.createdAt } : {}),
  });
}

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, members, organizations } from "@/db/schema";
import { sendWelcomeEmail } from "@/lib/email";
import { slugify } from "@/lib/slug";

export async function provisionPersonalOrg(user: {
  id: string;
  name: string;
  email: string;
}) {
  const existing = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.userId, user.id))
    .limit(1);

  if (existing.length > 0) return;

  const orgId = crypto.randomUUID();
  const first = user.name.trim().split(/\s+/)[0] || "Personal";
  const slug = `${slugify(first)}-${orgId.slice(0, 4)}`;

  await db.insert(organizations).values({
    id: orgId,
    name: `${first}'s pad`,
    slug,
    plan: "free",
    subscriptionStatus: "none",
  });

  await db.insert(members).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    userId: user.id,
    role: "owner",
  });

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    actorId: user.id,
    action: "org.created",
    targetType: "organization",
    targetId: orgId,
    metadata: { name: `${first}'s pad`, source: "signup" },
  });

  try {
    await sendWelcomeEmail(user.email, user.name);
  } catch (error) {
    console.error("welcome email failed", error);
  }
}

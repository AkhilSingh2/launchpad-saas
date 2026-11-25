import { and, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, sql } from "@/db";
import {
  auditLogs,
  invitations,
  launches,
  launchTasks,
  members,
  organizations,
  user,
} from "@/db/schema";
import { DEMO_PASSWORD } from "@/lib/demo";
import { sendInviteEmail } from "@/lib/email";
import { dayOffset } from "@/lib/format";
import { auth } from "@/lib/auth";

const people = [
  { email: "akhil@launchpad.dev", name: "Akhilendra Singh", platformRole: "admin" },
  { email: "maya@launchpad.dev", name: "Maya Chen", platformRole: "user" },
  { email: "jordan@launchpad.dev", name: "Jordan Lee", platformRole: "user" },
] as const;

async function ensureUser(person: (typeof people)[number]) {
  const [existing] = await db.select().from(user).where(eq(user.email, person.email)).limit(1);
  if (!existing) {
    await auth.api.signUpEmail({
      body: { email: person.email, password: DEMO_PASSWORD, name: person.name },
    });
  }
  const [row] = await db.select().from(user).where(eq(user.email, person.email)).limit(1);
  if (!row) throw new Error(`Could not create ${person.email}`);
  await db
    .update(user)
    .set({ emailVerified: true, platformRole: person.platformRole, updatedAt: new Date() })
    .where(eq(user.id, row.id));
  return row;
}

async function ensureMember(organizationId: string, userId: string, role: string) {
  const [existing] = await db
    .select()
    .from(members)
    .where(and(eq(members.organizationId, organizationId), eq(members.userId, userId)))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(members)
    .values({ id: crypto.randomUUID(), organizationId, userId, role })
    .returning();
  return created;
}

async function main() {
  const akhil = await ensureUser(people[0]);
  const maya = await ensureUser(people[1]);
  const jordan = await ensureUser(people[2]);

  let [org] = await db.select().from(organizations).where(eq(organizations.slug, "northstar")).limit(1);
  if (!org) {
    const id = crypto.randomUUID();
    [org] = await db
      .insert(organizations)
      .values({
        id,
        name: "Northstar",
        slug: "northstar",
        plan: "pro",
        subscriptionStatus: "active",
        stripeCustomerId: "stub_cus_northstar",
        stripeSubscriptionId: "stub_sub_northstar",
      })
      .returning();
  }

  await ensureMember(org.id, akhil.id, "owner");
  await ensureMember(org.id, maya.id, "admin");
  await ensureMember(org.id, jordan.id, "member");

  const existingLaunches = await db
    .select({ id: launches.id })
    .from(launches)
    .where(eq(launches.organizationId, org.id));

  if (existingLaunches.length === 0) {
    const specs = [
      {
        name: "Public beta",
        summary: "Open the beta to the waitlist and keep the checklist honest.",
        status: "ready",
        targetDate: dayOffset(12),
        tasks: ["Freeze the API", "Write the launch note", "Confirm billing copy", "Ping design for the OG image"],
      },
      {
        name: "Docs relaunch",
        summary: "Replace the old docs IA before the beta post goes out.",
        status: "draft",
        targetDate: dayOffset(30),
        tasks: ["Inventory stale pages", "Draft the new IA"],
      },
      {
        name: "Pricing experiment",
        summary: "The first price test already shipped. Leave the notes in the record.",
        status: "launched",
        targetDate: dayOffset(-6),
        tasks: ["Ship the price test", "Read the first-week notes"],
      },
    ];

    for (const spec of specs) {
      const launchId = crypto.randomUUID();
      await db.insert(launches).values({
        id: launchId,
        organizationId: org.id,
        name: spec.name,
        summary: spec.summary,
        status: spec.status,
        targetDate: spec.targetDate,
        createdBy: akhil.id,
      });
      await db.insert(launchTasks).values(
        spec.tasks.map((title, position) => ({
          id: crypto.randomUUID(),
          launchId,
          title,
          done: spec.status === "launched",
          position,
        })),
      );
    }

    const story = [
      { action: "launch.created", actorId: akhil.id, days: 6, metadata: { name: "Public beta" } },
      { action: "member.invited", actorId: akhil.id, days: 5, metadata: { email: maya.email, role: "admin" } },
      { action: "member.joined", actorId: maya.id, days: 5, metadata: { role: "admin" } },
      { action: "billing.plan_changed", actorId: akhil.id, days: 4, metadata: { from: "free", to: "pro" } },
      { action: "launch.updated", actorId: maya.id, days: 2, metadata: { name: "Public beta", status: "ready" } },
    ];
    await db.insert(auditLogs).values(
      story.map((entry) => ({
        id: crypto.randomUUID(),
        organizationId: org.id,
        actorId: entry.actorId,
        action: entry.action,
        targetType: "organization",
        targetId: org.id,
        metadata: entry.metadata,
        createdAt: new Date(Date.now() - entry.days * 86_400_000),
      })),
    );
  }

  const [invite] = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.organizationId, org.id), eq(invitations.email, "guest@launchpad.dev")))
    .limit(1);
  if (!invite) {
    const token = randomBytes(24).toString("hex");
    await db.insert(invitations).values({
      id: crypto.randomUUID(),
      organizationId: org.id,
      email: "guest@launchpad.dev",
      role: "member",
      token,
      invitedBy: maya.id,
      expiresAt: new Date(Date.now() + 7 * 86_400_000),
    });
    await sendInviteEmail({
      to: "guest@launchpad.dev",
      orgName: org.name,
      inviter: maya.name,
      role: "member",
      token,
    });
  }

  console.log("Seeded Northstar. Demo password:", DEMO_PASSWORD);
  await sql.end({ timeout: 5 });
}

main().catch(async (error) => {
  console.error(error);
  await sql.end({ timeout: 5 });
  process.exit(1);
});

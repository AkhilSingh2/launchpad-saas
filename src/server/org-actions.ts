"use server";

import { and, eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { members, organizations } from "@/db/schema";
import { auth } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { PermissionError } from "@/lib/rbac";
import { slugify } from "@/lib/slug";
import { ORG_COOKIE } from "@/lib/tenant";
import { firstIssue, orgNameInput, profileInput } from "@/lib/validators";
import { errorRedirect, noticeRedirect, requirePermission, requireSession, requireWorkspace } from "@/server/context";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: (process.env.BETTER_AUTH_URL ?? "").startsWith("https://"),
  };
}

export async function switchOrganization(formData: FormData) {
  const { user } = await requireWorkspace();
  const organizationId = String(formData.get("organizationId") ?? "");
  const [membership] = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.organizationId, organizationId), eq(members.userId, user.id)))
    .limit(1);
  if (!membership) errorRedirect("/app", "You are not a member of that organisation.");
  (await cookies()).set(ORG_COOKIE, organizationId, cookieOptions());
  redirect("/app");
}

export async function createOrganization(formData: FormData) {
  const session = await requireSession();
  const parsed = orgNameInput.safeParse({ name: formData.get("name") });
  if (!parsed.success) errorRedirect("/onboarding", firstIssue(parsed.error));

  const orgId = crypto.randomUUID();
  const slug = `${slugify(parsed.data.name)}-${orgId.slice(0, 4)}`;
  await db.insert(organizations).values({
    id: orgId,
    name: parsed.data.name,
    slug,
    plan: "free",
    subscriptionStatus: "none",
  });
  await db.insert(members).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    userId: session.user.id,
    role: "owner",
  });
  await writeAudit({
    organizationId: orgId,
    actorId: session.user.id,
    action: "org.created",
    targetType: "organization",
    targetId: orgId,
    metadata: { name: parsed.data.name },
  });
  (await cookies()).set(ORG_COOKIE, orgId, cookieOptions());
  redirect("/app");
}

export async function updateOrganization(formData: FormData) {
  try {
    const { org, user } = await requirePermission("org:update");
    const parsed = orgNameInput.safeParse({ name: formData.get("name") });
    if (!parsed.success) errorRedirect("/app/settings", firstIssue(parsed.error));
    await db
      .update(organizations)
      .set({ name: parsed.data.name, updatedAt: new Date() })
      .where(eq(organizations.id, org.organizationId));
    await writeAudit({
      organizationId: org.organizationId,
      actorId: user.id,
      action: "org.updated",
      targetType: "organization",
      targetId: org.organizationId,
      metadata: { name: parsed.data.name },
    });
    noticeRedirect("/app/settings", "Organisation name saved.");
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/settings", error.message);
    throw error;
  }
}

export async function updateProfile(formData: FormData) {
  const session = await requireSession();
  const parsed = profileInput.safeParse({ name: formData.get("name") });
  if (!parsed.success) errorRedirect("/app/settings", firstIssue(parsed.error));
  await auth.api.updateUser({
    headers: await headers(),
    body: { name: parsed.data.name },
  });
  noticeRedirect("/app/settings", `Profile saved for ${session.user.email}.`);
}

export async function leaveOrganization() {
  const { org, user, role } = await requireWorkspace();
  if (role === "owner") {
    errorRedirect("/app/settings", "Transfer ownership before leaving.");
  }
  await db
    .delete(members)
    .where(and(eq(members.organizationId, org.organizationId), eq(members.userId, user.id)));
  await writeAudit({
    organizationId: org.organizationId,
    actorId: user.id,
    action: "member.removed",
    targetType: "user",
    targetId: user.id,
    metadata: { reason: "left" },
  });
  (await cookies()).delete(ORG_COOKIE);
  redirect("/app");
}

export async function deleteOrganization(formData: FormData) {
  try {
    const { org } = await requirePermission("org:delete");
    const confirm = String(formData.get("confirm") ?? "");
    if (confirm !== org.slug) errorRedirect("/app/settings", "Type the organisation slug to delete it.");
    await db.delete(organizations).where(eq(organizations.id, org.organizationId));
    (await cookies()).delete(ORG_COOKIE);
    redirect("/app");
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/settings", error.message);
    throw error;
  }
}

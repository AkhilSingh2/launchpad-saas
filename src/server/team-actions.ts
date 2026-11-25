"use server";

import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { invitations, members, organizations, user } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { sendInviteEmail } from "@/lib/email";
import { inviteIsOpen, normalizeEmail } from "@/lib/invites";
import { canAcceptSeat, canInviteSeat, PLANS } from "@/lib/plans";
import { canRemoveMember, isRole, PermissionError } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { getUsage, ORG_COOKIE } from "@/lib/tenant";
import { firstIssue, inviteInput } from "@/lib/validators";
import { errorRedirect, noticeRedirect, requirePermission, requireSession } from "@/server/context";

function orgCookie(organizationId: string) {
  return {
    name: ORG_COOKIE,
    value: organizationId,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: (process.env.BETTER_AUTH_URL ?? "").startsWith("https://"),
    },
  };
}

export async function inviteMember(formData: FormData) {
  try {
    const { org, user: actor, role, plan } = await requirePermission("member:invite");
    const limited = rateLimit({
      key: `invite:${actor.id}`,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) errorRedirect("/app/team", "Too many invites. Try again in an hour.");

    const parsed = inviteInput.safeParse({
      email: formData.get("email"),
      role: formData.get("role"),
    });
    if (!parsed.success) errorRedirect("/app/team", firstIssue(parsed.error));
    if (role !== "owner" && parsed.data.role === "admin") {
      errorRedirect("/app/team", "Only an owner can invite another admin.");
    }

    const email = normalizeEmail(parsed.data.email);
    const usage = await getUsage(org.organizationId);
    if (!canInviteSeat(plan, usage.members, usage.pendingInvites)) {
      errorRedirect("/app/team", `The ${PLANS[plan].name} plan has no seats left.`);
    }

    const [existingMember] = await db
      .select({ id: members.id })
      .from(members)
      .innerJoin(user, eq(members.userId, user.id))
      .where(and(eq(members.organizationId, org.organizationId), eq(user.email, email)))
      .limit(1);
    if (existingMember) errorRedirect("/app/team", "That person is already on the team.");

    const [pending] = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(
        and(
          eq(invitations.organizationId, org.organizationId),
          eq(invitations.email, email),
          eq(invitations.status, "pending"),
        ),
      )
      .limit(1);
    if (pending) errorRedirect("/app/team", "An invite is already waiting for that email.");

    const token = randomBytes(24).toString("hex");
    const id = crypto.randomUUID();
    await db.insert(invitations).values({
      id,
      organizationId: org.organizationId,
      email,
      role: parsed.data.role,
      token,
      invitedBy: actor.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await writeAudit({
      organizationId: org.organizationId,
      actorId: actor.id,
      action: "member.invited",
      targetType: "invitation",
      targetId: id,
      metadata: { email, role: parsed.data.role },
    });
    try {
      await sendInviteEmail({
        to: email,
        orgName: org.name,
        inviter: actor.name,
        role: parsed.data.role,
        token,
      });
    } catch (error) {
      console.error("invite email failed", error);
    }
    noticeRedirect("/app/team", `Invite sent to ${email}.`);
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/team", error.message);
    throw error;
  }
}

export async function revokeInvite(formData: FormData) {
  try {
    const { org, user: actor } = await requirePermission("member:invite");
    const inviteId = String(formData.get("inviteId") ?? "");
    await db
      .update(invitations)
      .set({ status: "revoked" })
      .where(
        and(eq(invitations.id, inviteId), eq(invitations.organizationId, org.organizationId)),
      );
    await writeAudit({
      organizationId: org.organizationId,
      actorId: actor.id,
      action: "member.invite_revoked",
      targetType: "invitation",
      targetId: inviteId,
    });
    noticeRedirect("/app/team", "Invite revoked.");
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/team", error.message);
    throw error;
  }
}

export async function changeRole(formData: FormData) {
  try {
    const { org, user: actor } = await requirePermission("member:role");
    const memberId = String(formData.get("memberId") ?? "");
    const nextRole = String(formData.get("role") ?? "");
    if (!isRole(nextRole)) errorRedirect("/app/team", "Unknown role.");

    const [target] = await db
      .select()
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.organizationId, org.organizationId)))
      .limit(1);
    if (!target) errorRedirect("/app/team", "Member not found.");
    if (target.userId === actor.id) errorRedirect("/app/team", "You cannot change your own role.");

    await db.transaction(async (tx) => {
      if (nextRole === "owner") {
        await tx
          .update(members)
          .set({ role: "admin" })
          .where(and(eq(members.organizationId, org.organizationId), eq(members.role, "owner")));
      }
      await tx.update(members).set({ role: nextRole }).where(eq(members.id, target.id));
    });

    await writeAudit({
      organizationId: org.organizationId,
      actorId: actor.id,
      action: "member.role_changed",
      targetType: "user",
      targetId: target.userId,
      metadata: { from: target.role, to: nextRole },
    });
    noticeRedirect("/app/team", nextRole === "owner" ? "Ownership transferred." : "Role updated.");
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/team", error.message);
    throw error;
  }
}

export async function removeMember(formData: FormData) {
  try {
    const { org, user: actor, role } = await requirePermission("member:remove");
    const memberId = String(formData.get("memberId") ?? "");
    const [target] = await db
      .select()
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.organizationId, org.organizationId)))
      .limit(1);
    if (!target || !isRole(target.role)) errorRedirect("/app/team", "Member not found.");
    if (!canRemoveMember(role, target.role, target.userId === actor.id)) {
      errorRedirect("/app/team", "You cannot remove that person.");
    }
    await db.delete(members).where(eq(members.id, target.id));
    await writeAudit({
      organizationId: org.organizationId,
      actorId: actor.id,
      action: "member.removed",
      targetType: "user",
      targetId: target.userId,
    });
    noticeRedirect("/app/team", "Member removed.");
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/team", error.message);
    throw error;
  }
}

export async function acceptInvitation(formData: FormData) {
  const session = await requireSession();
  const token = String(formData.get("token") ?? "");
  const [invite] = await db.select().from(invitations).where(eq(invitations.token, token)).limit(1);
  if (!invite || !inviteIsOpen(invite)) {
    errorRedirect(`/invite/${token}`, "This invite is no longer valid.");
  }
  if (normalizeEmail(session.user.email) !== normalizeEmail(invite.email)) {
    errorRedirect(`/invite/${token}`, `This invite was sent to ${invite.email}.`);
  }

  const [already] = await db
    .select({ id: members.id })
    .from(members)
    .where(
      and(eq(members.organizationId, invite.organizationId), eq(members.userId, session.user.id)),
    )
    .limit(1);

  const jar = await cookies();
  if (already) {
    const cookie = orgCookie(invite.organizationId);
    jar.set(cookie.name, cookie.value, cookie.options);
    noticeRedirect("/app", "You are already on that team.");
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, invite.organizationId))
    .limit(1);
  if (!org) errorRedirect(`/invite/${token}`, "That organisation no longer exists.");

  const usage = await getUsage(invite.organizationId);
  const plan = org.plan === "pro" || org.plan === "team" ? org.plan : "free";
  if (!canAcceptSeat(plan, usage.members)) {
    errorRedirect(`/invite/${token}`, "This organisation has no seats left.");
  }

  const role = isRole(invite.role) && invite.role !== "owner" ? invite.role : "member";
  await db.insert(members).values({
    id: crypto.randomUUID(),
    organizationId: invite.organizationId,
    userId: session.user.id,
    role,
  });
  await db.update(invitations).set({ status: "accepted" }).where(eq(invitations.id, invite.id));
  await writeAudit({
    organizationId: invite.organizationId,
    actorId: session.user.id,
    action: "member.joined",
    targetType: "user",
    targetId: session.user.id,
    metadata: { role },
  });
  const cookie = orgCookie(invite.organizationId);
  jar.set(cookie.name, cookie.value, cookie.options);
  noticeRedirect("/app", `You joined ${org.name}.`);
}

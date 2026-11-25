"use server";

import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { launchTasks, launches } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { canCreateLaunch, PLANS } from "@/lib/plans";
import { PermissionError } from "@/lib/rbac";
import { getUsage } from "@/lib/tenant";
import { firstIssue, launchInput, taskInput } from "@/lib/validators";
import { errorRedirect, launchInOrg, noticeRedirect, requirePermission } from "@/server/context";

export async function createLaunch(formData: FormData) {
  try {
    const { org, user, plan } = await requirePermission("launch:create");
    const parsed = launchInput.safeParse({
      name: formData.get("name"),
      summary: formData.get("summary") ?? "",
      targetDate: formData.get("targetDate") ?? "",
      status: formData.get("status") || "draft",
    });
    if (!parsed.success) errorRedirect("/app/launches/new", firstIssue(parsed.error));

    const usage = await getUsage(org.organizationId);
    if (!canCreateLaunch(plan, usage.launches)) {
      const cap = PLANS[plan].launches;
      errorRedirect(
        "/app/launches/new",
        `The ${PLANS[plan].name} plan includes ${cap} launch${cap === 1 ? "" : "es"}. Upgrade to add another.`,
      );
    }

    const id = crypto.randomUUID();
    await db.insert(launches).values({
      id,
      organizationId: org.organizationId,
      name: parsed.data.name,
      summary: parsed.data.summary,
      status: parsed.data.status,
      targetDate: parsed.data.targetDate || null,
      createdBy: user.id,
    });
    await writeAudit({
      organizationId: org.organizationId,
      actorId: user.id,
      action: "launch.created",
      targetType: "launch",
      targetId: id,
      metadata: { name: parsed.data.name },
    });
    redirect(`/app/launches/${id}`);
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/launches", error.message);
    throw error;
  }
}

export async function updateLaunch(formData: FormData) {
  try {
    const { org, user } = await requirePermission("launch:update");
    const launchId = String(formData.get("launchId") ?? "");
    const launch = await launchInOrg(launchId, org.organizationId);
    if (!launch) errorRedirect("/app/launches", "That launch is not in this organisation.");
    const parsed = launchInput.safeParse({
      name: formData.get("name"),
      summary: formData.get("summary") ?? "",
      targetDate: formData.get("targetDate") ?? "",
      status: formData.get("status") || launch.status,
    });
    if (!parsed.success) errorRedirect(`/app/launches/${launchId}`, firstIssue(parsed.error));
    await db
      .update(launches)
      .set({
        name: parsed.data.name,
        summary: parsed.data.summary,
        status: parsed.data.status,
        targetDate: parsed.data.targetDate || null,
        updatedAt: new Date(),
      })
      .where(eq(launches.id, launchId));
    await writeAudit({
      organizationId: org.organizationId,
      actorId: user.id,
      action: "launch.updated",
      targetType: "launch",
      targetId: launchId,
      metadata: { name: parsed.data.name, status: parsed.data.status },
    });
    noticeRedirect(`/app/launches/${launchId}`, "Launch saved.");
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/launches", error.message);
    throw error;
  }
}

export async function deleteLaunch(formData: FormData) {
  try {
    const { org, user } = await requirePermission("launch:delete");
    const launchId = String(formData.get("launchId") ?? "");
    const launch = await launchInOrg(launchId, org.organizationId);
    if (!launch) errorRedirect("/app/launches", "That launch is not in this organisation.");
    await db.delete(launches).where(eq(launches.id, launchId));
    await writeAudit({
      organizationId: org.organizationId,
      actorId: user.id,
      action: "launch.deleted",
      targetType: "launch",
      targetId: launchId,
      metadata: { name: launch.name },
    });
    noticeRedirect("/app/launches", "Launch deleted.");
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/launches", error.message);
    throw error;
  }
}

export async function addTask(formData: FormData) {
  try {
    const { org, user } = await requirePermission("launch:update");
    const launchId = String(formData.get("launchId") ?? "");
    const launch = await launchInOrg(launchId, org.organizationId);
    if (!launch) errorRedirect("/app/launches", "That launch is not in this organisation.");
    const parsed = taskInput.safeParse({ title: formData.get("title") });
    if (!parsed.success) errorRedirect(`/app/launches/${launchId}`, firstIssue(parsed.error));
    const [last] = await db
      .select({ position: launchTasks.position })
      .from(launchTasks)
      .where(eq(launchTasks.launchId, launchId))
      .orderBy(desc(launchTasks.position))
      .limit(1);
    const id = crypto.randomUUID();
    await db.insert(launchTasks).values({
      id,
      launchId,
      title: parsed.data.title,
      position: (last?.position ?? -1) + 1,
    });
    await writeAudit({
      organizationId: org.organizationId,
      actorId: user.id,
      action: "task.created",
      targetType: "launch_task",
      targetId: id,
      metadata: { title: parsed.data.title, launchId },
    });
    redirect(`/app/launches/${launchId}`);
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/launches", error.message);
    throw error;
  }
}

export async function toggleTask(formData: FormData) {
  try {
    const { org, user } = await requirePermission("launch:update");
    const launchId = String(formData.get("launchId") ?? "");
    const taskId = String(formData.get("taskId") ?? "");
    const launch = await launchInOrg(launchId, org.organizationId);
    if (!launch) errorRedirect("/app/launches", "That launch is not in this organisation.");
    const done = String(formData.get("done") ?? "") === "true";
    const updated = await db
      .update(launchTasks)
      .set({ done })
      .where(and(eq(launchTasks.id, taskId), eq(launchTasks.launchId, launchId)))
      .returning({ id: launchTasks.id });
    if (updated.length === 0) errorRedirect(`/app/launches/${launchId}`, "Task not found.");
    await writeAudit({
      organizationId: org.organizationId,
      actorId: user.id,
      action: "task.toggled",
      targetType: "launch_task",
      targetId: taskId,
      metadata: { done, launchId },
    });
    redirect(`/app/launches/${launchId}`);
  } catch (error) {
    if (error instanceof PermissionError) errorRedirect("/app/launches", error.message);
    throw error;
  }
}

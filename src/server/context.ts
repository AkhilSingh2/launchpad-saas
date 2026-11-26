import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { launches } from "@/db/schema";
import { auth } from "@/lib/auth";
import { DEMO_ORG_SLUG, DEMO_USERS, demoMode } from "@/lib/demo";
import { orgPlan, roleOf, getOrgContext } from "@/lib/tenant";
import { assertCan, type Action } from "@/lib/rbac";

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}

export async function requireWorkspace() {
  const session = await requireSession();
  const context = await getOrgContext(session.user.id);
  if (!context) redirect("/onboarding");
  const role = roleOf(context.current.role);
  const plan = orgPlan(context.current.plan);
  return { session, context, role, plan, org: context.current, user: session.user };
}

export async function requirePermission(action: Action) {
  const workspace = await requireWorkspace();
  assertCan(workspace.role, action);
  return workspace;
}

export async function launchInOrg(launchId: string, organizationId: string) {
  const [launch] = await db
    .select()
    .from(launches)
    .where(and(eq(launches.id, launchId), eq(launches.organizationId, organizationId)))
    .limit(1);
  return launch ?? null;
}

export function errorRedirect(path: string, error: string): never {
  const params = new URLSearchParams({ error: error.slice(0, 200) });
  redirect(`${path}?${params.toString()}`);
}

export function noticeRedirect(path: string, notice: string): never {
  const params = new URLSearchParams({ notice: notice.slice(0, 200) });
  redirect(`${path}?${params.toString()}`);
}

const DEMO_LOCKED = "This part of the shared demo is locked so the next visitor sees the same workspace.";

/** On the hosted demo, keeps visitors from removing people from, or deleting, the shared workspace. */
export function guardDemoOrg(slug: string, path: string) {
  if (demoMode() && slug === DEMO_ORG_SLUG) errorRedirect(path, DEMO_LOCKED);
}

/** On the hosted demo, keeps the seeded accounts' profiles intact. */
export function guardDemoUser(email: string, path: string) {
  if (demoMode() && DEMO_USERS.some((person) => person.email === email)) errorRedirect(path, DEMO_LOCKED);
}

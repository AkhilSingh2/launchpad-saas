import { AppShell } from "@/components/app/shell";
import { formatCap, PLANS } from "@/lib/plans";
import { isPlatformAdmin } from "@/lib/rbac";
import { getUsage } from "@/lib/tenant";
import { requireWorkspace } from "@/server/context";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, org, context, role, plan } = await requireWorkspace();
  const usage = await getUsage(org.organizationId);
  const seatsUsed = usage.members + usage.pendingInvites;

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        platformAdmin: isPlatformAdmin(user.platformRole),
      }}
      org={{ id: org.organizationId, name: org.name, plan, role }}
      orgs={context.orgs.map((item) => ({
        id: item.organizationId,
        name: item.name,
        role: item.role,
      }))}
      usage={{
        launches: `${usage.launches} / ${formatCap(PLANS[plan].launches)}`,
        seats: `${seatsUsed} / ${formatCap(PLANS[plan].seats)}`,
      }}
    >
      {children}
    </AppShell>
  );
}

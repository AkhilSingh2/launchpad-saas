import { Flash } from "@/components/flash";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { can } from "@/lib/rbac";
import { deleteOrganization, leaveOrganization, updateOrganization, updateProfile } from "@/server/org-actions";
import { requireWorkspace } from "@/server/context";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const { org, user, role } = await requireWorkspace();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader eyebrow="Account" title="Settings" description="Profile follows you. The organisation name follows the pad." />
      <Flash error={query.error} notice={query.notice} />
      <form action={updateProfile} className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-medium">Profile</h2>
        <div className="space-y-2">
          <Label htmlFor="profile-name">Name</Label>
          <Input id="profile-name" name="name" defaultValue={user.name} required minLength={2} />
        </div>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <Button type="submit">Save profile</Button>
      </form>
      {can(role, "org:update") ? (
        <form action={updateOrganization} className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-medium">Organisation</h2>
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input id="org-name" name="name" defaultValue={org.name} required minLength={2} />
          </div>
          <p className="text-sm text-muted-foreground">Slug {org.slug}</p>
          <Button type="submit">Save organisation</Button>
        </form>
      ) : null}
      {role === "owner" ? (
        <form action={deleteOrganization} className="space-y-3 rounded-2xl border border-destructive/40 p-5">
          <h2 className="font-medium">Delete organisation</h2>
          <p className="text-sm text-muted-foreground">Type <span className="font-mono">{org.slug}</span> to remove the pad and its launches.</p>
          <Label htmlFor="confirm" className="sr-only">
            Confirm slug
          </Label>
          <Input id="confirm" name="confirm" placeholder={org.slug} />
          <Button type="submit" variant="destructive">
            Delete organisation
          </Button>
        </form>
      ) : (
        <form action={leaveOrganization} className="rounded-2xl border border-border p-5">
          <h2 className="font-medium">Leave organisation</h2>
          <p className="mt-2 text-sm text-muted-foreground">You will lose access to {org.name}. Your other pads stay.</p>
          <Button type="submit" variant="outline" className="mt-4">
            Leave
          </Button>
        </form>
      )}
    </div>
  );
}

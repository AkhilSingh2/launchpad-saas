import { and, eq } from "drizzle-orm";
import { Flash } from "@/components/flash";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/db";
import { invitations, members, user } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { assignableRoles, can, canRemoveMember, isRole } from "@/lib/rbac";
import { requireWorkspace } from "@/server/context";
import { changeRole, inviteMember, removeMember, revokeInvite } from "@/server/team-actions";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const query = await searchParams;
  const { org, role, user: actor } = await requireWorkspace();
  const people = await db
    .select({
      id: members.id,
      role: members.role,
      userId: user.id,
      name: user.name,
      email: user.email,
    })
    .from(members)
    .innerJoin(user, eq(members.userId, user.id))
    .where(eq(members.organizationId, org.organizationId));
  const pending = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.organizationId, org.organizationId), eq(invitations.status, "pending")));
  const canInvite = can(role, "member:invite");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="People"
        title="Team"
        description="Invites are bound to an email. Accepting one checks the seat limit again."
      />
      <Flash error={query.error} notice={query.notice} />
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {people.map((person) => {
          const personRole = isRole(person.role) ? person.role : "member";
          const roles = assignableRoles(role).filter(() => person.userId !== actor.id);
          return (
            <li key={person.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">{person.name}</p>
                <p className="text-sm text-muted-foreground">{person.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {roles.length > 0 ? (
                  <form action={changeRole} className="flex items-center gap-2">
                    <input type="hidden" name="memberId" value={person.id} />
                    <label className="sr-only" htmlFor={`role-${person.id}`}>
                      Role for {person.name}
                    </label>
                    <select
                      id={`role-${person.id}`}
                      name="role"
                      defaultValue={personRole}
                      className="h-9 rounded-xl border border-input bg-card px-2 text-sm"
                    >
                      {roles.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="outline">
                      Save
                    </Button>
                  </form>
                ) : (
                  <Badge>{personRole}</Badge>
                )}
                {canRemoveMember(role, personRole, person.userId === actor.id) ? (
                  <form action={removeMember}>
                    <input type="hidden" name="memberId" value={person.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Remove
                    </Button>
                  </form>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-medium">Pending invites</h2>
          <ul className="mt-3 space-y-2">
            {pending.length === 0 ? (
              <li className="text-sm text-muted-foreground">No invites waiting.</li>
            ) : (
              pending.map((invite) => (
                <li key={invite.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
                  <span>
                    {invite.email}
                    <span className="block text-muted-foreground">
                      {invite.role} · expires {formatDate(invite.expiresAt)}
                    </span>
                  </span>
                  {canInvite ? (
                    <form action={revokeInvite}>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Revoke
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
        {canInvite ? (
          <form action={inviteMember} className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-medium">Invite teammate</h2>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select id="role" name="role" defaultValue="member" className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm">
                <option value="member">Member</option>
                {role === "owner" ? <option value="admin">Admin</option> : null}
              </select>
            </div>
            <Button type="submit">Send invite</Button>
          </form>
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground" data-testid="invite-forbidden">
            Members can work on launches. Invites and role changes stay with owners and admins.
          </p>
        )}
      </section>
    </div>
  );
}

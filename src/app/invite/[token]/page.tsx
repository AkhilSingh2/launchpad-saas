import Link from "next/link";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { Flash } from "@/components/flash";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { invitations, organizations } from "@/db/schema";
import { auth } from "@/lib/auth";
import { inviteIsOpen } from "@/lib/invites";
import { acceptInvitation } from "@/server/team-actions";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const [invite] = await db.select().from(invitations).where(eq(invitations.token, token)).limit(1);
  const [org] = invite
    ? await db.select().from(organizations).where(eq(organizations.id, invite.organizationId)).limit(1)
    : [];
  const session = await auth.api.getSession({ headers: await headers() });
  const open = invite ? inviteIsOpen(invite) : false;

  return (
    <main id="content" className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
      <p className="text-xs uppercase tracking-[0.16em] text-accent">Invitation</p>
      <h1 className="mt-3 font-display text-4xl">
        {org && open ? `Join ${org.name}` : "This invite is closed"}
      </h1>
      {org && open ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {invite?.email} is invited as {invite?.role}. Sign in with that email to accept.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Ask the owner to send a new one.</p>
      )}
      <div className="mt-4">
        <Flash error={query.error} />
      </div>
      {open && invite ? (
        session ? (
          <form action={acceptInvitation} className="mt-6">
            <input type="hidden" name="token" value={token} />
            <Button type="submit">Accept invite</Button>
          </form>
        ) : (
          <Button asChild className="mt-6 w-fit">
            <Link href={`/login?next=/invite/${token}`}>Sign in to accept</Link>
          </Button>
        )
      ) : null}
    </main>
  );
}

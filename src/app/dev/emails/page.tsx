import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BillingEmail, InviteEmail, WelcomeEmail } from "@/emails/messages";
import { db } from "@/db";
import { emailOutbox } from "@/db/schema";
import { emailPreviewEnabled } from "@/lib/email";
import { formatWhen } from "@/lib/format";
import { appBaseUrl } from "@/lib/stripe";

export default async function EmailPreviewPage() {
  await connection();
  if (!emailPreviewEnabled()) notFound();
  const outbox = await db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(12);
  const appUrl = appBaseUrl();

  return (
    <main id="content" className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-accent">Dev preview</p>
        <h1 className="mt-2 font-display text-4xl">Transactional email</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Templates render with React Email. Without RESEND_API_KEY they are stored in the outbox below and logged on the server.
        </p>
      </div>
      <section className="grid gap-6">
        <WelcomeEmail name="Akhilendra Singh" appUrl={appUrl} />
        <InviteEmail
          orgName="Northstar"
          inviter="Akhilendra Singh"
          role="member"
          acceptUrl={`${appUrl}/invite/preview-token`}
        />
        <BillingEmail orgName="Northstar" plan="Pro" appUrl={appUrl} />
      </section>
      <section>
        <h2 className="font-medium">Outbox</h2>
        <ul className="mt-3 space-y-4">
          {outbox.length === 0 ? (
            <li className="text-sm text-muted-foreground">No messages yet. Sign up or send an invite.</li>
          ) : (
            outbox.map((message) => (
              <li key={message.id} className="rounded-2xl border border-border p-4">
                <p className="text-sm font-medium">
                  {message.template} · {message.toAddress}
                </p>
                <p className="text-sm text-muted-foreground">
                  {message.subject} · {formatWhen(message.createdAt)}
                </p>
                <iframe title={message.subject} className="mt-3 h-64 w-full rounded-xl border border-border bg-white" srcDoc={message.html} />
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}

import { render } from "@react-email/render";
import { Resend } from "resend";
import { db } from "@/db";
import { emailOutbox } from "@/db/schema";
import { BillingEmail, InviteEmail, WelcomeEmail } from "@/emails/messages";
import { appBaseUrl } from "@/lib/stripe";

export function emailPreviewEnabled() {
  if (process.env.EMAIL_PREVIEW === "true") return true;
  if (process.env.EMAIL_PREVIEW === "false") return false;
  return process.env.NODE_ENV !== "production";
}

async function deliver(input: {
  to: string;
  subject: string;
  html: string;
  template: string;
}) {
  await db.insert(emailOutbox).values({
    id: crypto.randomUUID(),
    toAddress: input.to,
    subject: input.subject,
    html: input.html,
    template: input.template,
  });

  if (!process.env.RESEND_API_KEY) {
    console.info(`[launchpad mail] ${input.template} -> ${input.to}: ${input.subject}`);
    return { delivered: false as const };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "LaunchPad <hello@launchpad.dev>",
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  return { delivered: true as const };
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = await render(WelcomeEmail({ name, appUrl: appBaseUrl() }));
  return deliver({ to, subject: "Welcome to LaunchPad", html, template: "welcome" });
}

export async function sendInviteEmail(input: {
  to: string;
  orgName: string;
  inviter: string;
  role: string;
  token: string;
}) {
  const acceptUrl = `${appBaseUrl()}/invite/${input.token}`;
  const html = await render(
    InviteEmail({
      orgName: input.orgName,
      inviter: input.inviter,
      role: input.role,
      acceptUrl,
    }),
  );
  return deliver({
    to: input.to,
    subject: `Join ${input.orgName} on LaunchPad`,
    html,
    template: "invite",
  });
}

export async function sendBillingEmail(to: string, orgName: string, plan: string) {
  const html = await render(BillingEmail({ orgName, plan, appUrl: appBaseUrl() }));
  return deliver({
    to,
    subject: `${orgName} is now on ${plan}`,
    html,
    template: "billing",
  });
}

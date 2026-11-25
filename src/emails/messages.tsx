import { EmailLayout, EmailParagraph } from "@/emails/layout";

export function WelcomeEmail({ name, appUrl }: { name: string; appUrl: string }) {
  return (
    <EmailLayout
      preview={`Welcome to LaunchPad, ${name}.`}
      title={`Your pad is ready, ${name.split(" ")[0]}.`}
      action={{ href: `${appUrl}/app`, label: "Open LaunchPad" }}
    >
      <EmailParagraph>
        We created a free organisation for you. Invite the people who will ship the launch, then
        add the checklist.
      </EmailParagraph>
      <EmailParagraph>
        Billing stays on the Free plan until an owner or admin upgrades. No keys are required to
        explore the local demo.
      </EmailParagraph>
    </EmailLayout>
  );
}

export function InviteEmail({
  orgName,
  inviter,
  role,
  acceptUrl,
}: {
  orgName: string;
  inviter: string;
  role: string;
  acceptUrl: string;
}) {
  return (
    <EmailLayout
      preview={`${inviter} invited you to ${orgName} on LaunchPad.`}
      title={`Join ${orgName}`}
      action={{ href: acceptUrl, label: "Accept invite" }}
    >
      <EmailParagraph>
        {inviter} invited you to {orgName} as {role === "admin" ? "an admin" : "a member"}. The
        invite expires in seven days.
      </EmailParagraph>
      <EmailParagraph>Sign in with this email address to accept it.</EmailParagraph>
    </EmailLayout>
  );
}

export function BillingEmail({
  orgName,
  plan,
  appUrl,
}: {
  orgName: string;
  plan: string;
  appUrl: string;
}) {
  return (
    <EmailLayout
      preview={`${orgName} is now on the ${plan} plan.`}
      title={`${orgName} is on ${plan}.`}
      action={{ href: `${appUrl}/app/billing`, label: "Review billing" }}
    >
      <EmailParagraph>
        The plan change is recorded in the audit log. Seat and launch limits update immediately.
      </EmailParagraph>
    </EmailLayout>
  );
}

import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flash } from "@/components/flash";
import { getOrgContext } from "@/lib/tenant";
import { createOrganization } from "@/server/org-actions";
import { requireSession } from "@/server/context";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  const existing = await getOrgContext(session.user.id);
  if (existing) redirect("/app");
  const query = await searchParams;

  return (
    <main id="content" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Logo />
      <h1 className="mt-8 font-display text-4xl">Name the organisation</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        You are the owner. The plan starts on Free.
      </p>
      <Flash error={query.error} />
      <form action={createOrganization} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Organisation name</Label>
          <Input id="name" name="name" required minLength={2} />
        </div>
        <Button type="submit">Create organisation</Button>
      </form>
    </main>
  );
}

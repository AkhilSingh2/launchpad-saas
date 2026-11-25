import { Flash } from "@/components/flash";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLaunch } from "@/server/launch-actions";

export default async function NewLaunchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader eyebrow="New" title="Plan a launch" description="Name it, date it, and leave a note the team can read." />
      <Flash error={query.error} />
      <form action={createLaunch} className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required minLength={2} placeholder="Public beta" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea id="summary" name="summary" placeholder="What has to be true on launch day?" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="targetDate">Target date</Label>
            <Input id="targetDate" name="targetDate" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="launched">Launched</option>
            </select>
          </div>
        </div>
        <Button type="submit">Create launch</Button>
      </form>
    </div>
  );
}

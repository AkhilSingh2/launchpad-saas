import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="content" className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <p className="text-xs uppercase tracking-[0.16em] text-accent">404</p>
      <h1 className="mt-2 font-display text-4xl">That page left orbit.</h1>
      <p className="mt-3 text-muted-foreground">The link may be expired, or the record belongs to another organisation.</p>
      <Button asChild className="mt-6 w-fit">
        <Link href="/">Back home</Link>
      </Button>
    </main>
  );
}

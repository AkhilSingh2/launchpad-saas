import Link from "next/link";

export function DemoBanner() {
  return (
    <div
      role="note"
      className="relative z-40 border-b border-border bg-secondary/80 px-4 py-2 text-center text-xs text-muted-foreground backdrop-blur"
    >
      <span className="font-medium text-foreground">Demo mode</span>
      <span aria-hidden="true"> · </span>
      Sample data that resets daily. Checkout is simulated, no card is charged.
      <span aria-hidden="true"> · </span>
      <Link href="https://github.com/AkhilSingh2/launchpad-saas" className="underline underline-offset-4 hover:text-foreground">
        Source
      </Link>
    </div>
  );
}

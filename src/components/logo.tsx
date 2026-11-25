import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <svg aria-hidden="true" viewBox="0 0 32 32" className="size-7">
        <rect width="32" height="32" rx="9" className="fill-primary" />
        <path
          d="M7 23c7-1 8-9 18-13"
          fill="none"
          stroke="#ff7a45"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="24" cy="10" r="2.2" fill="#fff7f2" />
      </svg>
      LaunchPad
    </span>
  );
}

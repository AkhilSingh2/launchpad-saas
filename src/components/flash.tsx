export function Flash({ error, notice }: { error?: string; notice?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error.slice(0, 200)}
      </p>
    );
  }
  if (notice) {
    return (
      <p role="status" className="rounded-xl border border-emerald-700/20 bg-emerald-700/10 px-3 py-2 text-sm">
        {notice.slice(0, 200)}
      </p>
    );
  }
  return null;
}

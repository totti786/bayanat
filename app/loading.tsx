export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-2 text-neutral-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-700" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}

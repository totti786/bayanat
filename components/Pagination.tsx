import Link from "next/link";

export default function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (p: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-3">
      <p className="text-xs text-neutral-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1.5">
        {page > 1 && (
          <Link
            href={buildHref(page - 1)}
            className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            ← Prev
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={buildHref(page + 1)}
            className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-900 text-xl font-bold text-white">
        !
      </div>
      <h2 className="mt-4 text-lg font-bold text-neutral-900">Something went wrong</h2>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">
        An unexpected error occurred. Try again, or refresh the page.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
      >
        Try again
      </button>
    </div>
  );
}

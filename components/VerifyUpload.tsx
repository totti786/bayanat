"use client";

import { useState } from "react";

export default function VerifyUpload() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; signerName?: string; error?: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement).files?.[0];
    if (!file) return;

    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/verify", { method: "POST", body: fd });
      const json = await res.json();
      setResult(json);
    } catch {
      setResult({ valid: false, error: "Could not verify the file" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white p-6">
      <p className="text-center text-sm font-medium text-neutral-700">
        Verify any PDF from this company
      </p>
      <form onSubmit={onSubmit} className="mt-3 flex items-center gap-2">
        <input
          type="file"
          name="file"
          accept="application/pdf"
          className="min-w-0 flex-1 text-sm text-neutral-600 file:mr-2 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-neutral-800"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-lg bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {busy ? "Checking…" : "Verify"}
        </button>
      </form>
      {result && (
        <p className={`mt-3 text-center text-sm font-medium ${result.valid ? "text-emerald-700" : "text-red-700"}`}>
          {result.valid ? `✓ Valid — signed by ${result.signerName ?? "unknown signer"}` : `✕ Invalid — ${result.error ?? "signature could not be verified"}`}
        </p>
      )}
    </div>
  );
}

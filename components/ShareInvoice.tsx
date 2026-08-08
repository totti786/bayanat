"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendInvoiceEmail } from "@/lib/actions/invoices";
import { Button } from "@/components/ui";
import { u, type UiLang } from "@/lib/ui";

export default function ShareInvoice({
  invoiceId,
  clientEmail,
  lang,
}: {
  invoiceId: string;
  clientEmail: string | null;
  lang: UiLang;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ url: string; emailed: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  async function share() {
    setBusy(true);
    setError(null);
    try {
      const result = await sendInvoiceEmail(invoiceId);
      setDialog({ url: result.shareUrl, emailed: result.emailed });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!dialog) return;
    try {
      await navigator.clipboard.writeText(dialog.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={share} disabled={busy}>
          {busy ? u("loading", lang) : clientEmail ? u("shareEmail", lang) : u("shareLink", lang)}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900">Invoice link</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Anyone with this link can view and download the PDF — no login needed.
            </p>
            {dialog.emailed && (
              <div className="mt-3 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                Emailed to {clientEmail}
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-xs text-neutral-700">{dialog.url}</span>
              <Button variant="secondary" className="shrink-0 px-3 py-1.5 text-xs" onClick={copy}>
                {copied ? u("copied", lang) : u("copy", lang)}
              </Button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDialog(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setDialog(null);
                  router.push(`/share/${dialog.url.split("/share/")[1].split(/[?#]/)[0]}`);
                }}
              >
                Open
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

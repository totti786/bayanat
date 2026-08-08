"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { convertQuote } from "@/lib/actions/invoices";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui";
import { u, type UiLang } from "@/lib/ui";

export default function ConvertQuoteButton({
  invoiceId,
  toKind,
  lang,
}: {
  invoiceId: string;
  toKind: "invoice" | "quote";
  lang: UiLang;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const isQuoteToInvoice = toKind === "invoice";

  async function convert() {
    setBusy(true);
    try {
      await convertQuote(invoiceId, toKind);
      toast({
        title: isQuoteToInvoice ? "Converted to invoice" : "Converted to quote",
        description: isQuoteToInvoice
          ? "Payments can now be recorded."
          : "Payments are now disabled.",
      });
      router.refresh();
    } catch (e) {
      toast({
        title: "Could not convert",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" onClick={convert} disabled={busy}>
      {busy ? u("loading", lang) : isQuoteToInvoice ? u("convertToInvoice", lang) : u("convertToQuote", lang)}
    </Button>
  );
}

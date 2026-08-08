"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finalizeInvoice, deleteInvoice, cancelInvoice } from "@/lib/actions/invoices";
import { useConfirm } from "@/components/Confirm";
import { u, type UiLang } from "@/lib/ui";
import { useToast } from "@/components/Toast";
import { Button, ButtonLink } from "@/components/ui";

export default function InvoiceActions({
  invoiceId,
  status,
  lang,
}: {
  invoiceId: string;
  status: string;
  lang: UiLang;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(action: "send" | "cancel" | "delete") {
    setBusy(action);
    try {
      if (action === "send") {
        await finalizeInvoice(invoiceId);
        toast({ title: u("sent", lang), description: "" });
        router.refresh();
      } else if (action === "cancel") {
        const ok = await confirm({
          title: u("cancelInvoice", lang),
          description: "Its number will be voided and it can no longer be paid.",
          confirmLabel: u("cancelInvoice", lang),
        });
        if (!ok) return;
        await cancelInvoice(invoiceId);
        toast({ title: u("cancelled", lang) });
        router.refresh();
      } else {
        const ok = await confirm({
          title: u("delete", lang) + " " + u("draft", lang) + "?",
          description: "This permanently removes the draft and its line items.",
          confirmLabel: u("delete", lang),
        });
        if (!ok) return;
        await deleteInvoice(invoiceId);
        toast({ title: u("draft", lang) });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ButtonLink href={`/invoices/${invoiceId}/pdf`} variant="secondary">
        Preview PDF
      </ButtonLink>
      <ButtonLink href={`/api/invoices/${invoiceId}/pdf`} variant="secondary">
        Download PDF
      </ButtonLink>
      {status === "draft" && (
        <>
          <ButtonLink href={`/invoices/${invoiceId}/edit`} variant="secondary">
            Edit
          </ButtonLink>
          <Button
            onClick={() => run("send")}
            disabled={busy === "send"}
            title="Assigns the next invoice number"
          >
            {busy === "send" ? u("sending", lang) : u("sendInvoice", lang)}
          </Button>
          <Button variant="danger" onClick={() => run("delete")} disabled={busy === "delete"}>
            {u("delete", lang)}
          </Button>
        </>
      )}
      {(status === "sent" || status === "partially_paid" || status === "overdue") && (
        <Button variant="secondary" onClick={() => run("cancel")} disabled={busy === "cancel"}>
          {u("cancelInvoice", lang)}
        </Button>
      )}
    </div>
  );
}

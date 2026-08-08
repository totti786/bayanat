"use client";

import { useActionState, useState } from "react";
import { issueCreditNote } from "@/lib/actions/invoices";
import { fromMinor } from "@/lib/money";
import { u, type UiLang } from "@/lib/ui";
import { Button, Input, Field, ErrorBanner, SuccessBanner } from "@/components/ui";

export default function CreditNoteDialog({
  invoiceId,
  paidMinor,
  currency,
  lang,
}: {
  invoiceId: string;
  paidMinor: number;
  currency: string;
  lang: UiLang;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(issueCreditNote.bind(null, invoiceId), null);
  const paidMajor = fromMinor(paidMinor, currency);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {lang === "ar" ? "إشعار دائن…" : "Credit note…"}
      </Button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900">
              {lang === "ar" ? "إصدار إشعار دائن" : "Issue a credit note"}
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              {lang === "ar"
                ? "يرد المبلغ للعميل ويُخصم من رصيد الفاتورة."
                : "Credits the client and reduces this invoice's balance."}
            </p>
            <ErrorBanner message={state?.error} />
            <SuccessBanner message={state?.success ? (lang === "ar" ? "تم إصدار الإشعار" : "Credit note issued") : undefined} />
            <form action={formAction} className="mt-4 space-y-4">
              <Field label={`${u("amount", lang)} (${currency})`} hint={`${u("paid", lang)}: ${paidMajor.toFixed(2)}`}>
                <Input name="amount" type="number" min="0.01" step="0.01" max={paidMajor} required placeholder="0.00" />
              </Field>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  {u("close", lang)}
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? u("loading", lang) : lang === "ar" ? "إصدار" : "Issue"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePayment } from "@/lib/actions/invoices";
import { fromMinor } from "@/lib/money";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/components/Toast";
import { methodLabel } from "@/components/invoice/types";
import { u, type UiLang } from "@/lib/ui";
import type { Lang } from "@/lib/format";

export default function PaymentsList({
  invoiceId,
  payments,
  currency,
  lang,
  uiLang,
}: {
  invoiceId: string;
  payments: {
    id: string;
    amount: number;
    method: string;
    date: string;
    reference: string | null;
  }[];
  currency: string;
  lang: Lang;
  uiLang: UiLang;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const fmt = new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency,
  });

  async function remove(id: string) {
    const ok = await confirm({
      title: u("delete", uiLang) + " " + u("paymentMethod", uiLang) + "?",
      description: "The invoice balance will be recalculated.",
      confirmLabel: u("delete", uiLang),
    });
    if (!ok) return;
    setBusy(id);
    try {
      await deletePayment(id, invoiceId);
      toast({ title: u("delete", uiLang) });
      router.refresh();
    } catch (e) {
      toast({
        title: "Could not remove payment",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="divide-y divide-neutral-100">
      {payments.map((p) => (
        <div key={p.id} className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-neutral-900">{fmt.format(fromMinor(p.amount, currency))}</p>
            <p className="text-xs text-neutral-500">
              {methodLabel(p.method, lang)}
              {p.reference ? ` · ${p.reference}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400">
              {new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US").format(new Date(p.date))}
            </span>
            <button
              onClick={() => remove(p.id)}
              disabled={busy === p.id}
              className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
            >
              {busy === p.id ? "…" : "Remove"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

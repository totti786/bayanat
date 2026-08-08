"use client";

import { useActionState } from "react";
import { recordPayment } from "@/lib/actions/invoices";
import { fromMinor } from "@/lib/money";
import { Button, Input, Select, Field, ErrorBanner } from "@/components/ui";
import { u, type UiLang } from "@/lib/ui";

export default function PaymentForm({
  invoiceId,
  balance,
  currency,
  methods = ["Bank transfer", "Card", "Cash"],
  lang,
}: {
  invoiceId: string;
  balance: number;
  currency: string;
  methods?: string[];
  lang: UiLang;
}) {
  const [state, formAction, pending] = useActionState(recordPayment.bind(null, invoiceId), null);
  const balanceMajor = fromMinor(balance, currency);

  return (
    <form action={formAction} className="space-y-4">
      <ErrorBanner message={state?.error} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label={`${u("amount", lang)} (${currency})`} hint={`${u("balance", lang)}: ${balanceMajor.toFixed(2)}`}>
          <Input name="amount" type="number" min="0.01" step="0.01" max={balanceMajor} required placeholder="0.00" />
        </Field>
        <Field label={u("paymentMethod", lang)}>
          <Select name="method" defaultValue={methods[0] ?? "bank_transfer"}>
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date">
          <Input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Reference">
          <Input name="reference" placeholder="Optional" />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || balance <= 0}>
          {pending ? u("saving", lang) : u("recordPayment", lang)}
        </Button>
      </div>
    </form>
  );
}

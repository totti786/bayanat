"use client";

import { useActionState, useState } from "react";
import { createRecurringFromInvoice } from "@/lib/actions/recurring";
import { Button, Input, Select, Field, ErrorBanner, SuccessBanner } from "@/components/ui";
import { u, type UiLang } from "@/lib/ui";

export default function RecurringDialog({ invoiceId, lang }: { invoiceId: string; lang: UiLang }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createRecurringFromInvoice.bind(null, invoiceId),
    null
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Repeat…
      </Button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900">{u("repeatInvoice", lang)}</h3>
            <p className="mt-1 text-sm text-neutral-500">
              {u("repeatHint", lang)}
            </p>
            <ErrorBanner message={state?.error} />
            <SuccessBanner message={state?.success ? (lang === "ar" ? "تم إنشاء الجدولة" : "Recurring schedule created") : undefined} />
            <form action={formAction} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label={u("frequency", lang)}>
                  <Select name="frequency" defaultValue="monthly">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </Select>
                </Field>
                <Field label={u("every", lang)}>
                  <Input name="interval" type="number" min={1} max={12} defaultValue={1} />
                </Field>
                <Field label={u("dayOfMonth", lang)} hint="1..31">
                  <Input name="dayOfMonth" type="number" min={1} max={31} placeholder="Auto" />
                </Field>
                <Field label={u("nextInvoice", lang)}>
                  <Input name="startDate" type="date" defaultValue={today} />
                </Field>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? u("creating", lang) : u("createSchedule", lang)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

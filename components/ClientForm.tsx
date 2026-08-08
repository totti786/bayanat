"use client";

import { useActionState } from "react";
import { createClient, updateClient } from "@/lib/actions/clients";
import { Button, Input, Select, Textarea, Field, ErrorBanner } from "@/components/ui";
import type { Client } from "@/generated/prisma/client";
import { u, type UiLang } from "@/lib/ui";

const CURRENCIES = ["USD", "EUR", "GBP", "SAR", "AED", "EGP", "KWD", "QAR", "OMR", "BHD", "JOD"];

export default function ClientForm({ client, lang }: { client?: Client; lang: UiLang }) {
  const action = client
    ? updateClient.bind(null, client.id)
    : createClient;
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      <ErrorBanner message={state?.error} />

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">{u("clientDetails", lang)}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={u("nameEn", lang)}>
            <Input name="name" defaultValue={client?.name ?? ""} placeholder="Acme Trading" required />
          </Field>
          <Field label={u("nameAr", lang)}>
            <Input name="nameAr" defaultValue={client?.nameAr ?? ""} placeholder="أكمة للتجارة" />
          </Field>
          <Field label={u("email", lang)}>
            <Input name="email" type="email" defaultValue={client?.email ?? ""} placeholder="billing@acme.com" />
          </Field>
          <Field label={u("phone", lang)}>
            <Input name="phone" defaultValue={client?.phone ?? ""} placeholder="+971 5X XXX XXXX" />
          </Field>
          <Field label={u("addressEn", lang)}>
            <Textarea name="address" defaultValue={client?.address ?? ""} placeholder="Street, City, Country" rows={2} />
          </Field>
          <Field label={u("addressAr", lang)}>
            <Textarea name="addressAr" defaultValue={client?.addressAr ?? ""} placeholder="الشارع، المدينة، الدولة" rows={2} />
          </Field>
          <Field label={u("taxId", lang)}>
            <Input name="taxId" defaultValue={client?.taxId ?? ""} placeholder="123456789" />
          </Field>
          <Field label={u("defaultCurrency", lang)}>
            <Select name="currency" defaultValue={client?.currency ?? "USD"}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label={u("invoiceLanguage", lang)}>
            <Select name="language" defaultValue={client?.language ?? "en"}>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </Select>
          </Field>
          <Field label={u("paymentTerms", lang)} hint="1–365">
            <Input name="paymentTerms" type="number" min={0} max={365} defaultValue={client?.paymentTerms ?? 14} />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? u("saving", lang) : client ? u("saveChanges", lang) : u("create", lang) + " " + u("client", lang)}
        </Button>
      </div>
    </form>
  );
}

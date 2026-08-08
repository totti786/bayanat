"use client";

import { useState, useActionState } from "react";
import { createInvoice, updateInvoice } from "@/lib/actions/invoices";
import { u, type UiLang } from "@/lib/ui";
import {
  Button,
  Input,
  Select,
  Textarea,
  Field,
  ErrorBanner,
} from "@/components/ui";

const CURRENCIES = ["USD", "EUR", "GBP", "SAR", "AED", "EGP", "KWD", "QAR", "OMR", "BHD", "JOD"];

interface LineState {
  description: string;
  descriptionAr: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
}

interface InvoiceFormProps {
  clients: {
    id: string;
    name: string;
    currency: string | null;
    language: string;
    paymentTerms: number;
  }[];
  products?: { id: string; name: string; nameAr: string | null; unitPrice: number; taxRate: number | null }[];
  defaultClientId?: string;
  org: {
    defaultCurrency: string;
    defaultTaxName: string | null;
    defaultTaxRate: number | null;
    taxInclusive: boolean;
    defaultTemplate: string;
  };
  invoice?: {
    id: string;
    clientId: string;
    lang: string;
    kind: string;
    currency: string;
    issueDate: string;
    dueDate: string | null;
    expiryDate: string | null;
    discountType: string;
    discountValue: number | null;
    taxName: string | null;
    taxRate: number | null;
    taxInclusive: boolean;
    template: string;
    notes: string | null;
    notesAr: string | null;
    items: {
      description: string;
      descriptionAr: string | null;
      quantity: number;
      unitPrice: number;
      taxRate: number | null;
    }[];
  };
}

const TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    ar: "كلاسيكي",
    desc: "Traditional ledger-style layout with clear tables",
  },
  {
    id: "modern",
    name: "Modern",
    ar: "عصري",
    desc: "Branded header band with a bold total panel",
  },
  {
    id: "minimal",
    name: "Minimal",
    ar: "بسيط",
    desc: "Editorial whitespace, thin rules, quiet type",
  },
  {
    id: "bilingual",
    name: "Bilingual",
    ar: "ثنائي اللغة",
    desc: "English and Arabic side by side in one document",
  },
] as const;

function todayInput(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export default function InvoiceForm({ clients, org, invoice, defaultClientId, uiLang, products = [] }: InvoiceFormProps & { uiLang: UiLang }) {
  const action = invoice ? updateInvoice.bind(null, invoice.id) : createInvoice;
  const [state, formAction, pending] = useActionState(action, null);

  const [lang, setLang] = useState(invoice?.lang ?? "en");
  const [kind, setKind] = useState(invoice?.kind ?? "invoice");
  const [template, setTemplate] = useState(invoice?.template ?? org.defaultTemplate ?? "classic");
  const [discountType, setDiscountType] = useState(invoice?.discountType ?? "none");
  const [taxInclusive, setTaxInclusive] = useState(invoice?.taxInclusive ?? org.taxInclusive);
  const [currency, setCurrency] = useState(invoice?.currency ?? org.defaultCurrency);
  const [issueDate, setIssueDate] = useState(invoice?.issueDate ?? todayInput());
  const [dueDate, setDueDate] = useState(invoice?.dueDate ?? "");
  const [expiryDate, setExpiryDate] = useState(invoice?.expiryDate ?? "");
  const [selectedClientId, setSelectedClientId] = useState(
    invoice?.clientId ?? defaultClientId ?? clients[0]?.id ?? ""
  );
  const [touched, setTouched] = useState({
    currency: Boolean(invoice),
    lang: Boolean(invoice),
    dueDate: Boolean(invoice?.dueDate),
  });
  const [items, setItems] = useState<LineState[]>(
    invoice?.items.map((it) => ({
      description: it.description,
      descriptionAr: it.descriptionAr ?? "",
      quantity: String(it.quantity),
      unitPrice: String(it.unitPrice),
      taxRate: it.taxRate != null ? String(it.taxRate) : "",
    })) ?? [{ description: "", descriptionAr: "", quantity: "1", unitPrice: "", taxRate: "" }]
  );

  const ar = lang === "ar";
  const [catalogId, setCatalogId] = useState("");

  function addFromCatalog() {
    const prod = products.find((p) => p.id === catalogId);
    if (!prod) return;
    setItems((prev) => [
      ...prev,
      {
        description: prod.name,
        descriptionAr: prod.nameAr ?? "",
        quantity: "1",
        unitPrice: String(prod.unitPrice),
        taxRate: prod.taxRate != null ? String(prod.taxRate) : "",
      },
    ]);
    setCatalogId("");
  }

  function toDateInput(d: Date): string {
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
  }

  function applyClientDefaults(clientId: string) {
    const c = clients.find((x) => x.id === clientId);
    if (!c) return;
    if (!touched.currency && c.currency) setCurrency(c.currency);
    if (!touched.lang) setLang(c.language === "ar" ? "ar" : "en");
    if (!touched.dueDate) {
      const d = new Date(`${issueDate}T12:00:00`);
      d.setDate(d.getDate() + c.paymentTerms);
      setDueDate(toDateInput(d));
    }
  }

  function onClientChange(clientId: string) {
    setSelectedClientId(clientId);
    applyClientDefaults(clientId);
  }

  function onIssueDateChange(value: string) {
    setIssueDate(value);
    if (!touched.dueDate) {
      const c = clients.find((x) => x.id === selectedClientId);
      const days = c?.paymentTerms ?? 0;
      const d = new Date(`${value || issueDate}T12:00:00`);
      d.setDate(d.getDate() + days);
      setDueDate(toDateInput(d));
    }
  }

  function updateItem(i: number, field: keyof LineState, value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }

  return (
    <form action={formAction} className="space-y-6">
      <ErrorBanner message={state?.error} />

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">{u("invoiceDetails", uiLang)}</h2>

        <div className="mb-5">
          <Field label={u("defaultTemplate", uiLang)}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup">
              {TEMPLATES.map((t) => (
                <label
                  key={t.id}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    template === t.id
                      ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={template === t.id}
                    onChange={() => setTemplate(t.id)}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900">{t.name}</span>
                    <span className="text-xs text-neutral-400">{ar ? t.ar : ""}</span>
                  </span>
                  <span className="mt-1 block text-[11px] leading-snug text-neutral-500">
                    {t.desc}
                  </span>
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={u("client", uiLang)}>
            <Select name="clientId" required value={selectedClientId} onChange={(e) => onClientChange(e.target.value)}>
              <option value="" disabled>
                …
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={u("invoiceLanguage", uiLang)}>
            <Select
              name="lang"
              value={lang}
              onChange={(e) => {
                setLang(e.target.value);
                setTouched((t) => ({ ...t, lang: true }));
              }}
            >
              <option value="en">English</option>
              <option value="ar">العربية (RTL)</option>
            </Select>
          </Field>
          <Field label={u("documentType", uiLang)}>
            <div className="flex gap-2">
              {[
                { id: "invoice", label: "Invoice" },
                { id: "quote", label: "Quote" },
              ].map((k) => (
                <label
                  key={k.id}
                  className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors ${
                    kind === k.id
                      ? "border-brand-600 bg-brand-50 text-brand-900"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="kind"
                    value={k.id}
                    checked={kind === k.id}
                    onChange={() => setKind(k.id as "invoice" | "quote")}
                    className="sr-only"
                  />
                  {k.label}
                </label>
              ))}
            </div>
          </Field>
          <Field label={u("defaultCurrency", uiLang)}>
            <Select
              name="currency"
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                setTouched((t) => ({ ...t, currency: true }));
              }}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label={u("issueDate", uiLang)}>
            <Input name="issueDate" type="date" required value={issueDate} onChange={(e) => onIssueDateChange(e.target.value)} />
          </Field>
          {kind === "invoice" ? (
            <Field label={u("dueDate", uiLang)} hint={ar ? "اختياري" : "Auto"}>
              <Input
                name="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  setTouched((t) => ({ ...t, dueDate: true }));
                }}
              />
            </Field>
          ) : (
            <Field label={u("dueDate", uiLang)} hint="—">
              <Input name="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </Field>
          )}
          <Field label={u("taxName", uiLang)}>
            <Input name="taxName" defaultValue={invoice?.taxName ?? org.defaultTaxName ?? ""} placeholder="VAT" />
          </Field>
          <Field label={u("taxRate", uiLang)}>
            <Input
              name="taxRate"
              type="number"
              min={0}
              max={100}
              step="0.01"
              defaultValue={
                invoice?.taxRate != null
                  ? String(invoice.taxRate)
                  : org.defaultTaxRate != null
                    ? String(org.defaultTaxRate)
                    : ""
              }
            />
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                name="taxInclusive"
                className="h-4 w-4 rounded border-neutral-300"
                checked={taxInclusive}
                onChange={(e) => setTaxInclusive(e.target.checked)}
              />
              {u("taxIncluded", uiLang)}
            </label>
          </div>
          <Field label={u("discount", uiLang)}>
            <div className="flex gap-2">
              <Select name="discountType" value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="w-36">
                <option value="none">None</option>
                <option value="percentage">Percent</option>
                <option value="fixed">Fixed</option>
              </Select>
              {discountType !== "none" && (
                <Input
                  name="discountValue"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={invoice?.discountValue ?? ""}
                  placeholder={discountType === "percentage" ? "%" : "Amount"}
                />
              )}
            </div>
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">{u("lineItems", uiLang)}</h2>
        {products.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <Select value={catalogId} onChange={(e) => setCatalogId(e.target.value)} className="max-w-xs">
              <option value="">{uiLang === "ar" ? "أضف من المنتجات…" : "Add from catalog…"}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            <Button type="button" variant="secondary" onClick={addFromCatalog} disabled={!catalogId}>
              {u("add", uiLang)}
            </Button>
          </div>
        )}
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label={`${u("description", uiLang)} (EN)`}>
                  <Input
                    name="itemDescription"
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    placeholder="Web development"
                    required
                  />
                </Field>
                <Field label={`${u("description", uiLang)} (AR)`}>
                  <Input
                    name="itemDescriptionAr"
                    value={item.descriptionAr}
                    onChange={(e) => updateItem(i, "descriptionAr", e.target.value)}
                    placeholder="تطوير موقع"
                    dir="rtl"
                  />
                </Field>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-3">
                <Field label={u("quantity", uiLang)}>
                  <Input
                    name="itemQuantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", e.target.value)}
                    required
                  />
                </Field>
                <Field label={u("unitPrice", uiLang)}>
                  <Input
                    name="itemUnitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </Field>
                <Field label={u("taxRate", uiLang)}>
                  <Input
                    name="itemTaxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={item.taxRate}
                    onChange={(e) => updateItem(i, "taxRate", e.target.value)}
                    placeholder="Default"
                  />
                </Field>
                <div className="flex items-end justify-end">
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() =>
            setItems((prev) => [...prev, { description: "", descriptionAr: "", quantity: "1", unitPrice: "", taxRate: "" }])
          }
        >
          + {u("addLineItem", uiLang)}
        </Button>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">{u("notes", uiLang)}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={`${u("notes", uiLang)} (EN)`}>
            <Textarea name="notes" defaultValue={invoice?.notes ?? ""} placeholder="Thank you for your business." rows={3} />
          </Field>
          <Field label={`${u("notes", uiLang)} (AR)`}>
            <Textarea name="notesAr" defaultValue={invoice?.notesAr ?? ""} placeholder="شكراً لتعاملكم معنا" rows={3} dir="rtl" />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="sendNow" className="h-4 w-4 rounded border-neutral-300" />
          {invoice ? u("sendInvoice", uiLang) : u("sendNow", uiLang)}
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? u("saving", uiLang) : invoice ? u("saveChanges", uiLang) : u("createInvoice", uiLang)}
        </Button>
      </div>
    </form>
  );
}

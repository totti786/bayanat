"use client";

import { useActionState, useState } from "react";
import { X } from "lucide-react";
import { u, type UiLang } from "@/lib/ui";
import {
  updateOrgSettings,
  uploadLogo,
  removeLogo,
  generateSignatureCert,
  updateSignature,
} from "@/lib/actions/settings";
import {
  Button,
  Input,
  Select,
  Textarea,
  Field,
  ErrorBanner,
  SuccessBanner,
} from "@/components/ui";

const CURRENCIES = ["USD", "EUR", "GBP", "SAR", "AED", "EGP", "KWD", "QAR", "OMR", "BHD", "JOD"];

export default function SettingsForm({
  org,
  lang,
}: {
  org: {
    name: string;
    nameAr: string | null;
    address: string | null;
    addressAr: string | null;
    vatId: string | null;
    bankDetails: string | null;
    logoUrl: string | null;
    prefix: string;
    defaultCurrency: string;
    defaultTaxName: string | null;
    defaultTaxRate: number | null;
    taxInclusive: boolean;
    numerals: string;
    defaultTemplate: string;
    hijriDates: boolean;
    signKey: string | null;
    signCert: string | null;
    paymentMethods: string[];
    lateFeePercent: number;
    reportCurrency: string | null;
    themeAccent: string | null;
  };
  lang: UiLang;
}) {
  const [state, formAction, pending] = useActionState(updateOrgSettings, null);
  const [logoState, logoAction, logoPending] = useActionState(uploadLogo, null);
  const [sigState, sigAction, sigPending] = useActionState(updateSignature, null);
  const [methods, setMethods] = useState<string[]>(org.paymentMethods);
  const [newMethod, setNewMethod] = useState("");

  function addMethod() {
    const label = newMethod.trim();
    if (!label || methods.includes(label)) return;
    setMethods((prev) => [...prev, label]);
    setNewMethod("");
  }

  function removeMethod(label: string) {
    setMethods((prev) => prev.filter((m) => m !== label));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">{u("logo", lang)}</h2>
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={org.logoUrl ?? "/icon.svg"} alt="Company logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col gap-2">
            <form action={logoAction} className="flex items-center gap-2">
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp"
                className="text-sm text-neutral-600 file:mr-2 file:rounded-md file:border-0 file:bg-brand-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-800"
              />
              <Button type="submit" variant="secondary" disabled={logoPending}>
                {logoPending ? u("loading", lang) : u("upload", lang)}
              </Button>
            </form>
            <ErrorBanner message={logoState?.error} />
            {org.logoUrl && (
              <form action={removeLogo}>
                <Button type="submit" variant="ghost" className="px-0 text-red-600 hover:bg-transparent hover:underline">
                  {u("removeLogo", lang)}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-1 text-sm font-semibold text-neutral-900">Digital signature</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Sign every PDF with a digital certificate. Clients verify it in any PDF reader, and
          tampering is always detected. Paste a certificate issued by a trust provider, or
          generate a self-signed one for free.
        </p>

        <form action={sigAction} className="space-y-4">
          <ErrorBanner message={sigState?.error} />
          <SuccessBanner message={sigState?.success ? "Signature settings saved" : undefined} />
          <div className="grid grid-cols-1 gap-4">
            <Field label="Private key (PEM)" hint="BEGIN PRIVATE KEY — kept in your database">
              <Textarea name="signKey" defaultValue={org.signKey ?? ""} rows={4} className="font-mono text-xs" />
            </Field>
            <Field label="Certificate (PEM)" hint="BEGIN CERTIFICATE — the public part shared with anyone verifying">
              <Textarea name="signCert" defaultValue={org.signCert ?? ""} rows={4} className="font-mono text-xs" />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={sigPending}>
              {sigPending ? "Saving…" : "Save signature"}
            </Button>
            <Button formAction={generateSignatureCert} variant="secondary">
              Generate a self-signed certificate
            </Button>
          </div>
          <p className="text-[11px] text-neutral-400">
            Self-signed signatures verify integrity in Adobe/Preview but show the signer as
            untrusted. A certificate from a CA removes that warning.
          </p>
        </form>
      </div>

      <form action={formAction} className="space-y-6">
      <ErrorBanner message={state?.error} />
      <SuccessBanner message={state?.success ? "Settings saved" : undefined} />

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">{u("organization", lang)}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={u("companyName", lang)}>
            <Input name="name" defaultValue={org.name} required />
          </Field>
          <Field label={u("companyNameAr", lang)}>
            <Input name="nameAr" defaultValue={org.nameAr ?? ""} dir="rtl" />
          </Field>
          <Field label={u("addressEn", lang)}>
            <Textarea name="address" defaultValue={org.address ?? ""} rows={2} />
          </Field>
          <Field label={u("addressAr", lang)}>
            <Textarea name="addressAr" defaultValue={org.addressAr ?? ""} rows={2} dir="rtl" />
          </Field>
          <Field label={u("taxId", lang)}>
            <Input name="vatId" defaultValue={org.vatId ?? ""} placeholder="Shown on every invoice" />
          </Field>
          <Field label={u("organization", lang) + " · IBAN"}>
            <Textarea name="bankDetails" defaultValue={org.bankDetails ?? ""} rows={2} />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">{u("numberingDefaults", lang)}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={u("invoicePrefix", lang)}>
            <Input name="prefix" defaultValue={org.prefix} maxLength={10} required />
          </Field>
          <Field label={u("defaultCurrency", lang)}>
            <Select name="defaultCurrency" defaultValue={org.defaultCurrency}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label={u("taxName", lang)}>
            <Input name="defaultTaxName" defaultValue={org.defaultTaxName ?? ""} placeholder="VAT" />
          </Field>
          <Field label={u("taxRate", lang)}>
            <Input
              name="defaultTaxRate"
              type="number"
              min={0}
              max={100}
              step="0.01"
              defaultValue={org.defaultTaxRate ?? 0}
            />
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                name="taxInclusive"
                className="h-4 w-4 rounded border-neutral-300"
                defaultChecked={org.taxInclusive}
              />
              {u("taxIncluded", lang)}
            </label>
          </div>
          <Field label={u("numerals", lang)}>
            <Select name="numerals" defaultValue={org.numerals}>
              <option value="western">{u("westernDigits", lang)}</option>
              <option value="eastern">{u("easternDigits", lang)}</option>
            </Select>
          </Field>
          <Field label={u("defaultTemplate", lang)}>
            <Select name="defaultTemplate" defaultValue={org.defaultTemplate}>
              <option value="classic">Classic — ledger style</option>
              <option value="modern">Modern — branded band</option>
              <option value="minimal">Minimal — editorial</option>
              <option value="bilingual">Bilingual — EN + AR side by side</option>
            </Select>
          </Field>
          <Field label={u("lateFeeLabel", lang)} hint={u("lateFeeHint", lang)}>
            <Input name="lateFeePercent" type="number" min={0} max={100} step="0.1" defaultValue={org.lateFeePercent || 0} />
          </Field>
          <Field label={u("reportCurrency", lang)} hint={u("reportCurrencyHint", lang)}>
            <Select name="reportCurrency" defaultValue={org.reportCurrency ?? ""}>
              <option value="">Same as default currency</option>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label={u("brandColor", lang)} hint={u("brandColorHint", lang)}>
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="themeAccent"
                defaultValue={org.themeAccent ?? "#2c6562"}
                className="h-10 w-14 cursor-pointer rounded-md border border-neutral-300 bg-white p-1"
              />
              <span className="text-xs text-neutral-400">Pick a color, or leave the default teal</span>
            </div>
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                name="hijriDates"
                className="h-4 w-4 rounded border-neutral-300"
                defaultChecked={org.hijriDates}
              />
              {u("hijriDates", lang)}
            </label>
          </div>
          <div className="sm:col-span-2">
            <Field label={u("paymentMethod", lang) + "s"} hint="—">
              <input type="hidden" name="paymentMethods" value={JSON.stringify(methods)} />
              <div className="flex flex-wrap items-center gap-2">
                {methods.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm text-brand-900"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => removeMethod(m)}
                      className="text-brand-400 hover:text-red-600"
                      aria-label={`Remove ${m}`}
                    >
                      <X size={14} strokeWidth={2.5} aria-hidden />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addMethod();
                      }
                    }}
                    placeholder="e.g. InstaPay, PayPal, Wallet"
                    className="w-52"
                  />
                  <Button type="button" variant="secondary" onClick={addMethod}>
                    Add
                  </Button>
                </div>
              </div>
              {methods.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  {lang === "ar" ? "لا توجد طرق دفع بعد — أضف واحدة على الأقل." : "No methods yet — add at least one so clients know how to pay."}
                </p>
              )}
            </Field>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? u("saving", lang) : u("saveSettings", lang)}
        </Button>
      </div>
      </form>
    </div>
  );
}

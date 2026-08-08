import { tr, loc, methodLabel, STATUS_BADGE, type InvoiceDocumentData } from "@/components/invoice/types";
import { formatMoney, formatMoneyShort, formatDate, formatPercent } from "@/lib/format";
import VatBlock from "@/components/invoice/VatBlock";
import PaymentMethodsBlock from "@/components/invoice/PaymentMethodsBlock";
import HijriLine from "@/components/invoice/HijriLine";

export default function ClassicTemplate(data: InvoiceDocumentData) {
  const { lang, numerals, org, client, invoice, lines, totals, payments, status, showPayments } = data;
  const currency = invoice.currency;
  const badge = STATUS_BADGE[status];
  const taxLabel = invoice.taxName || (invoice.taxRate ? tr("tax", lang) : "");
  const isQuote = data.kind === "quote";
  const isCredit = data.kind === "credit_note";
  const secondaryDate = isQuote ? invoice.expiryDate : invoice.dueDate;
  const secondaryLabel = isQuote ? "expiryDate" : "dueDate";

  return (
    <div className="px-[16mm] py-[15mm]">
      {/* Header */}
      <div className="flex items-start justify-between gap-8">
        <div className="flex items-start gap-4">
          {org.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logoUrl} alt="" className="h-14 w-14 object-contain" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-900 text-2xl font-bold text-white">
              {loc(lang, org.name, org.nameAr)?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xl font-bold leading-tight text-brand-950">
              {loc(lang, org.name, org.nameAr)}
            </p>
            {loc(lang, org.address, org.addressAr) && (
              <p className="mt-1 max-w-[80mm] text-[11px] leading-relaxed text-neutral-500 whitespace-pre-line">
                {loc(lang, org.address, org.addressAr)}
              </p>
            )}
            {org.vatId && (
              <p className="mt-1 text-[11px] text-neutral-500">
                {tr("taxId", lang)}: {org.vatId}
              </p>
            )}
          </div>
        </div>

        <div className="text-end">
          <h1 className="text-[32px] font-extrabold leading-none tracking-tight text-brand-950">
            {tr(isCredit ? "creditNote" : isQuote ? "quote" : "invoice", lang)}
          </h1>
          <div className="mt-4 space-y-1 text-[11px] text-neutral-600">
            <p>
              <span className="font-semibold text-brand-900">{tr("invoiceNumber", lang)}:</span>{" "}
              {invoice.number ?? "—"}
            </p>
            <p>
              <span className="font-semibold text-brand-900">{tr("issuedOn", lang)}:</span>{" "}
              {formatDate(invoice.issueDate, lang, numerals)}
              <HijriLine date={invoice.issueDate} lang={lang} numerals={numerals} enabled={data.hijriDates} />
            </p>
            {secondaryDate && (
              <p>
                <span className="font-semibold text-brand-900">{tr(secondaryLabel, lang)}:</span>{" "}
                {formatDate(secondaryDate, lang, numerals)}
              </p>
            )}
          </div>
          <div className="mt-3 inline-block rounded-md border border-brand-200 bg-brand-50 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-brand-800 uppercase">
            {badge[lang]}
          </div>
        </div>
      </div>

      {/* Bill to / From */}
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="rounded-xl bg-[#f6f5f0] p-4">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
            {tr("billTo", lang)}
          </p>
          <p className="mt-2 text-sm font-bold text-brand-950">
            {loc(lang, client.name, client.nameAr)}
          </p>
          {loc(lang, client.address, client.addressAr) && (
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 whitespace-pre-line">
              {loc(lang, client.address, client.addressAr)}
            </p>
          )}
          <div className="mt-1 text-[11px] text-neutral-500">
            {client.email && <p>{client.email}</p>}
            {client.phone && <p>{client.phone}</p>}
            {client.taxId && (
              <p>
                {tr("taxId", lang)}: {client.taxId}
              </p>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-[#f6f5f0] p-4">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
            {tr("from", lang)}
          </p>
          <p className="mt-2 text-sm font-bold text-brand-950">{loc(lang, org.name, org.nameAr)}</p>
          {org.bankDetails && (
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 whitespace-pre-line">
              {org.bankDetails}
            </p>
          )}
        </div>
      </div>

      {/* Items table */}
      <table className="mt-8 w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b-2 border-brand-900">
            <th className="py-2.5 text-start text-[10px] font-semibold tracking-[0.14em] text-brand-950 uppercase">
              {tr("description", lang)}
            </th>
            <th className="py-2.5 text-center text-[10px] font-semibold tracking-[0.14em] text-brand-950 uppercase">
              {tr("quantity", lang)}
            </th>
            <th className="py-2.5 text-end text-[10px] font-semibold tracking-[0.14em] text-brand-950 uppercase">
              {tr("unitPrice", lang)}
            </th>
            <th className="py-2.5 text-end text-[10px] font-semibold tracking-[0.14em] text-brand-950 uppercase">
              {tr("tax", lang)}
            </th>
            <th className="py-2.5 text-end text-[10px] font-semibold tracking-[0.14em] text-brand-950 uppercase">
              {tr("amount", lang)}
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="border-b border-neutral-200 align-top">
              <td className="py-3 pe-3">
                <p className="font-medium text-brand-950">
                  {loc(lang, line.description, line.descriptionAr)}
                </p>
              </td>
              <td className="py-3 text-center text-neutral-600">
                {formatMoneyShort(line.quantity, lang, numerals)}
              </td>
              <td className="py-3 text-end text-neutral-600">
                {formatMoney(line.unitPrice, currency, lang, numerals)}
              </td>
              <td className="py-3 text-end text-neutral-600">
                {line.taxRate ? formatPercent(line.taxRate, lang, numerals) : "—"}
              </td>
              <td className="py-3 text-end font-medium text-brand-950">
                {formatMoney(line.total, currency, lang, numerals)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-[70mm]">
          <div className="flex justify-between py-1.5 text-[11px] text-neutral-600">
            <span>{tr("subtotal", lang)}</span>
            <span className="text-brand-950">{formatMoney(totals.subtotal, currency, lang, numerals)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between py-1.5 text-[11px] text-neutral-600">
              <span>
                {tr("discount", lang)}
                {invoice.discountType === "percentage" && invoice.discountValue
                  ? ` (${formatPercent(invoice.discountValue, lang, numerals)})`
                  : ""}
              </span>
              <span className="text-brand-950">
                −{formatMoney(totals.discountAmount, currency, lang, numerals)}
              </span>
            </div>
          )}
          {totals.taxAmount > 0 && (
            <div className="flex justify-between py-1.5 text-[11px] text-neutral-600">
              <span>
                {taxLabel}
                {invoice.taxInclusive ? ` (${tr("taxIncluded", lang)})` : ""}
              </span>
              <span className="text-brand-950">{formatMoney(totals.taxAmount, currency, lang, numerals)}</span>
            </div>
          )}
          {totals.lateFee > 0 && (
            <div className="flex justify-between py-1.5 text-[11px] text-red-600">
              <span>
                {tr("lateFee", lang)}
                {totals.lateFeePercent ? ` (${formatPercent(totals.lateFeePercent, lang, numerals)})` : ""}
              </span>
              <span>{formatMoney(totals.lateFee, currency, lang, numerals)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between rounded-lg bg-brand-950 px-5 py-3.5 text-white">
            <span className="text-xs font-bold tracking-wide uppercase">{tr("total", lang)}</span>
            <span className="text-lg font-extrabold">
              {formatMoney(totals.total, currency, lang, numerals)}
            </span>
          </div>
        </div>
      </div>

      {/* Payments */}
      {showPayments && payments.length > 0 && (
        <div className="mt-8">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
            {tr("payments", lang)}
          </p>
          <table className="mt-2 w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-neutral-300 text-neutral-500">
                <th className="py-1.5 text-start font-medium">{tr("paymentDate", lang)}</th>
                <th className="py-1.5 text-start font-medium">{tr("paymentMethod", lang)}</th>
                <th className="py-1.5 text-start font-medium">{tr("reference", lang)}</th>
                <th className="py-1.5 text-end font-medium">{tr("amount", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i} className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-600">{formatDate(p.date, lang, numerals)}</td>
                  <td className="py-2 text-neutral-600">{methodLabel(p.method, lang)}</td>
                  <td className="py-2 text-neutral-600">{p.reference ?? "—"}</td>
                  <td className="py-2 text-end text-brand-950">
                    {formatMoney(p.amount, currency, lang, numerals)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-[70mm] space-y-1.5">
              <div className="flex justify-between text-[11px] text-neutral-600">
                <span>{tr("paid", lang)}</span>
                <span className="text-emerald-700">
                  {formatMoney(totals.paid, currency, lang, numerals)}
                </span>
              </div>
              <div className="flex justify-between rounded-lg bg-brand-50 px-5 py-2.5">
                <span className="text-xs font-bold text-brand-900 uppercase">{tr("balanceDue", lang)}</span>
                <span className="text-sm font-extrabold text-brand-900">
                  {formatMoney(totals.balance, currency, lang, numerals)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {loc(lang, invoice.notes, invoice.notesAr) && (
        <div className="mt-10 border-t border-neutral-200 pt-4">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
            {tr("notes", lang)}
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-600 whitespace-pre-line">
            {loc(lang, invoice.notes, invoice.notesAr)}
          </p>
        </div>
      )}

      <PaymentMethodsBlock data={data} />

      <div className="mt-12 flex items-center justify-center gap-2">
        <span className="h-px w-10 bg-gold-500" />
        <p className="text-[10px] text-neutral-400">{tr("thankYou", lang)}</p>
        <span className="h-px w-10 bg-gold-500" />
      </div>

      <VatBlock data={data} />
    </div>
  );
}

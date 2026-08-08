import { tr, loc, methodLabel, STATUS_BADGE, type InvoiceDocumentData } from "@/components/invoice/types";
import { formatMoney, formatMoneyShort, formatDate, formatPercent } from "@/lib/format";
import VatBlock from "@/components/invoice/VatBlock";
import PaymentMethodsBlock from "@/components/invoice/PaymentMethodsBlock";
import HijriLine from "@/components/invoice/HijriLine";

export default function ModernTemplate(data: InvoiceDocumentData) {
  const { lang, numerals, org, client, invoice, lines, totals, payments, status, showPayments } = data;
  const currency = invoice.currency;
  const badge = STATUS_BADGE[status];
  const taxLabel = invoice.taxName || (invoice.taxRate ? tr("tax", lang) : "");
  const unpaid = status === "sent" || status === "partially_paid" || status === "overdue";
  const isQuote = data.kind === "quote";
  const isCredit = data.kind === "credit_note";
  const secondaryDate = isQuote ? invoice.expiryDate : invoice.dueDate;
  const secondaryLabel = isQuote ? "expiryDate" : "dueDate";

  return (
    <div className="px-[16mm] py-[15mm]">
      {/* Full-bleed brand band */}
      <div className="-mx-[16mm] -mt-[15mm] flex items-start justify-between gap-8 bg-brand-950 px-[16mm] pt-[14mm] pb-[13mm]">
        <div className="flex items-start gap-4">
          {org.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logoUrl} alt="" className="h-14 w-14 rounded-lg object-contain bg-white" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold text-white">
              {loc(lang, org.name, org.nameAr)?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xl font-bold leading-tight text-white">
              {loc(lang, org.name, org.nameAr)}
            </p>
            {loc(lang, org.address, org.addressAr) && (
              <p className="mt-1 max-w-[80mm] text-[11px] leading-relaxed text-white/60 whitespace-pre-line">
                {loc(lang, org.address, org.addressAr)}
              </p>
            )}
            <p className="mt-1 text-[11px] text-white/60">
              {org.vatId ? `${tr("taxId", lang)}: ${org.vatId}` : ""}
            </p>
          </div>
        </div>

        <div className="text-end">
          <h1 className="text-[34px] font-extrabold leading-none tracking-tight text-white">
            {tr(isCredit ? "creditNote" : isQuote ? "quote" : "invoice", lang)}
          </h1>
          <div className="mt-3 space-y-1 text-[11px] text-white/80">
            <p>
              <span className="font-semibold text-white">{tr("invoiceNumber", lang)}:</span>{" "}
              {invoice.number ?? "—"}
            </p>
            <p>
              <span className="font-semibold text-white">{tr("issuedOn", lang)}:</span>{" "}
              {formatDate(invoice.issueDate, lang, numerals)}
            </p>
            <HijriLine date={invoice.issueDate} lang={lang} numerals={numerals} enabled={data.hijriDates} />
            {secondaryDate && (
              <p>
                <span className="font-semibold text-white">{tr(secondaryLabel, lang)}:</span>{" "}
                {formatDate(secondaryDate, lang, numerals)}
              </p>
            )}
          </div>
          <div className="mt-3 inline-block rounded-md bg-gold-500 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-brand-950 uppercase">
            {badge[lang]}
          </div>
        </div>
      </div>

      {/* Bill to + highlights */}
      <div className="mt-[12mm] grid grid-cols-2 gap-8">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
            {tr("billTo", lang)}
          </p>
          <p className="mt-2 text-base font-bold text-brand-950">
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

        <div className="rounded-xl bg-brand-50 p-5">
          <div className="space-y-2 text-[11px] text-neutral-600">
            {invoice.currency && (
              <div className="flex justify-between">
                <span>{tr("invoiceCurrency", lang)}</span>
                <span className="font-medium text-brand-950">{invoice.currency}</span>
              </div>
            )}
            {taxLabel && (
              <div className="flex justify-between">
                <span>{taxLabel}</span>
                <span className="font-medium text-brand-950">
                  {invoice.taxRate ? formatPercent(invoice.taxRate, lang, numerals) : "—"}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{tr("issuedOn", lang)}</span>
              <span className="font-medium text-brand-950">{formatDate(invoice.issueDate, lang, numerals)}</span>
            </div>
            {secondaryDate && (
              <div className="flex justify-between">
                <span>{tr(secondaryLabel, lang)}</span>
                <span className="font-medium text-brand-950">{formatDate(secondaryDate, lang, numerals)}</span>
              </div>
            )}
          </div>
          <div className="mt-4 border-t border-brand-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
                {unpaid ? tr("balanceDue", lang) : tr("total", lang)}
              </span>
              <span className="text-xl font-extrabold text-brand-900">
                {formatMoney(unpaid ? totals.balance : totals.total, currency, lang, numerals)}
              </span>
            </div>
            {showPayments && totals.paid > 0 && (
              <p className="mt-1 text-end text-[10px] text-emerald-700">
                {tr("paid", lang)}: {formatMoney(totals.paid, currency, lang, numerals)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items table */}
      <table className="mt-8 w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-brand-50">
            <th className="rounded-s-lg py-2.5 ps-3 text-start text-[10px] font-semibold tracking-[0.14em] text-brand-800 uppercase">
              {tr("description", lang)}
            </th>
            <th className="py-2.5 text-center text-[10px] font-semibold tracking-[0.14em] text-brand-800 uppercase">
              {tr("quantity", lang)}
            </th>
            <th className="py-2.5 text-end text-[10px] font-semibold tracking-[0.14em] text-brand-800 uppercase">
              {tr("unitPrice", lang)}
            </th>
            <th className="py-2.5 text-end text-[10px] font-semibold tracking-[0.14em] text-brand-800 uppercase">
              {tr("tax", lang)}
            </th>
            <th className="rounded-e-lg py-2.5 pe-3 text-end text-[10px] font-semibold tracking-[0.14em] text-brand-800 uppercase">
              {tr("amount", lang)}
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="border-b border-neutral-100 align-top">
              <td className="py-3.5 ps-3 pe-3">
                <p className="font-medium text-brand-950">
                  {loc(lang, line.description, line.descriptionAr)}
                </p>
              </td>
              <td className="py-3.5 text-center text-neutral-600">
                {formatMoneyShort(line.quantity, lang, numerals)}
              </td>
              <td className="py-3.5 text-end text-neutral-600">
                {formatMoney(line.unitPrice, currency, lang, numerals)}
              </td>
              <td className="py-3.5 text-end text-neutral-600">
                {line.taxRate ? formatPercent(line.taxRate, lang, numerals) : "—"}
              </td>
              <td className="py-3.5 pe-3 text-end font-semibold text-brand-950">
                {formatMoney(line.total, currency, lang, numerals)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-[68mm] rounded-xl bg-brand-50 p-5">
          <div className="flex justify-between py-1 text-[11px] text-neutral-600">
            <span>{tr("subtotal", lang)}</span>
            <span className="text-brand-950">{formatMoney(totals.subtotal, currency, lang, numerals)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between py-1 text-[11px] text-neutral-600">
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
            <div className="flex justify-between py-1 text-[11px] text-neutral-600">
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
          <div className="mt-3 flex items-center justify-between border-t border-brand-200 pt-3">
            <span className="text-xs font-bold tracking-wide text-brand-900 uppercase">{tr("total", lang)}</span>
            <span className="text-lg font-extrabold text-brand-900">
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
        </div>
      )}

      {/* Notes */}
      {loc(lang, invoice.notes, invoice.notesAr) && (
        <div className="mt-10 rounded-r-lg border-s-[3px] border-gold-500 ps-4">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
            {tr("notes", lang)}
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-600 whitespace-pre-line">
            {loc(lang, invoice.notes, invoice.notesAr)}
          </p>
        </div>
      )}

      <PaymentMethodsBlock data={data} />

      <p className="mt-14 text-center text-[10px] text-neutral-400">{tr("thankYou", lang)}</p>

      <VatBlock data={data} />
    </div>
  );
}

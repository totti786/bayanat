import { tr, loc, methodLabel, STATUS_BADGE, type InvoiceDocumentData } from "@/components/invoice/types";
import { formatMoney, formatMoneyShort, formatDate, formatPercent } from "@/lib/format";
import VatBlock from "@/components/invoice/VatBlock";
import PaymentMethodsBlock from "@/components/invoice/PaymentMethodsBlock";
import HijriLine from "@/components/invoice/HijriLine";

export default function MinimalTemplate(data: InvoiceDocumentData) {
  const { lang, numerals, org, client, invoice, lines, totals, payments, status, showPayments } = data;
  const currency = invoice.currency;
  const badge = STATUS_BADGE[status];
  const taxLabel = invoice.taxName || (invoice.taxRate ? tr("tax", lang) : "");
  const isQuote = data.kind === "quote";
  const isCredit = data.kind === "credit_note";
  const secondaryDate = isQuote ? invoice.expiryDate : invoice.dueDate;
  const secondaryLabel = isQuote ? "expiryDate" : "dueDate";

  return (
    <div className="px-[18mm] py-[18mm]">
      {/* Header */}
      <div className="flex items-start justify-between gap-8">
        <div>
          <p className="text-2xl font-extralight leading-tight tracking-tight text-brand-950">
            {loc(lang, org.name, org.nameAr)}
          </p>
          <div className="mt-2 text-[10px] leading-relaxed text-neutral-500">
            {loc(lang, org.address, org.addressAr) && (
              <p className="whitespace-pre-line">{loc(lang, org.address, org.addressAr)}</p>
            )}
            {org.vatId && <p className="mt-0.5">{tr("taxId", lang)}: {org.vatId}</p>}
          </div>
        </div>
        <div className="text-end">
          <p className="text-[10px] font-semibold tracking-[0.22em] text-neutral-400 uppercase">
            {tr(isCredit ? "creditNote" : isQuote ? "quote" : "invoice", lang)}
          </p>
          <p className="mt-1 text-lg font-light text-brand-950">{invoice.number ?? "—"}</p>
          <p className="mt-2 text-[10px] tracking-[0.18em] text-neutral-400 uppercase">
            {badge[lang]}
          </p>
        </div>
      </div>

      {/* Meta hairline block */}
      <div className="mt-6 grid grid-cols-3 gap-6 border-y border-neutral-200 py-3 text-[11px]">
        <div>
          <p className="text-[9px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">
            {tr("issuedOn", lang)}
          </p>
          <p className="mt-1 font-normal text-brand-950">{formatDate(invoice.issueDate, lang, numerals)}</p>
          <HijriLine date={invoice.issueDate} lang={lang} numerals={numerals} enabled={data.hijriDates} />
        </div>
        <div>
          <p className="text-[9px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">
            {tr(secondaryLabel, lang)}
          </p>
          <p className="mt-1 font-normal text-brand-950">
            {secondaryDate ? formatDate(secondaryDate, lang, numerals) : "—"}
          </p>
        </div>
        <div className="text-end">
          <p className="text-[9px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">
            {tr("invoiceCurrency", lang)}
          </p>
          <p className="mt-1 font-normal text-brand-950">{invoice.currency}</p>
        </div>
      </div>

      {/* Parties */}
      <div className="mt-8 grid grid-cols-2 gap-10">
        <div>
          <p className="text-[9px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">
            {tr("billTo", lang)}
          </p>
          <p className="mt-2 text-base font-normal text-brand-950">
            {loc(lang, client.name, client.nameAr)}
          </p>
          <div className="mt-1 text-[11px] leading-relaxed text-neutral-500">
            {loc(lang, client.address, client.addressAr) && (
              <p className="whitespace-pre-line">{loc(lang, client.address, client.addressAr)}</p>
            )}
            {client.email && <p>{client.email}</p>}
            {client.phone && <p>{client.phone}</p>}
            {client.taxId && <p>{tr("taxId", lang)}: {client.taxId}</p>}
          </div>
        </div>
        <div>
          <p className="text-[9px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">
            {tr("from", lang)}
          </p>
          <p className="mt-2 text-base font-normal text-brand-950">{loc(lang, org.name, org.nameAr)}</p>
          {org.bankDetails && (
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 whitespace-pre-line">
              {org.bankDetails}
            </p>
          )}
        </div>
      </div>

      {/* Items */}
      <table className="mt-10 w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-neutral-300">
            <th className="py-2.5 text-start text-[9px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">
              {tr("description", lang)}
            </th>
            <th className="py-2.5 text-center text-[9px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">
              {tr("quantity", lang)}
            </th>
            <th className="py-2.5 text-end text-[9px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">
              {tr("unitPrice", lang)}
            </th>
            <th className="py-2.5 text-end text-[9px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">
              {tr("tax", lang)}
            </th>
            <th className="py-2.5 text-end text-[9px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">
              {tr("amount", lang)}
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="border-b border-neutral-100 align-top">
              <td className="py-3.5 pe-3">
                <p className="font-normal text-brand-950">
                  {loc(lang, line.description, line.descriptionAr)}
                </p>
              </td>
              <td className="py-3.5 text-center text-neutral-500">
                {formatMoneyShort(line.quantity, lang, numerals)}
              </td>
              <td className="py-3.5 text-end text-neutral-500">
                {formatMoney(line.unitPrice, currency, lang, numerals)}
              </td>
              <td className="py-3.5 text-end text-neutral-500">
                {line.taxRate ? formatPercent(line.taxRate, lang, numerals) : "—"}
              </td>
              <td className="py-3.5 text-end font-medium text-brand-950">
                {formatMoney(line.total, currency, lang, numerals)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-8 flex justify-end">
        <div className="w-[62mm]">
          <div className="flex justify-between py-1.5 text-[11px] text-neutral-500">
            <span>{tr("subtotal", lang)}</span>
            <span className="text-brand-950">{formatMoney(totals.subtotal, currency, lang, numerals)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between py-1.5 text-[11px] text-neutral-500">
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
            <div className="flex justify-between py-1.5 text-[11px] text-neutral-500">
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
          <div className="mt-3 flex items-baseline justify-between border-t border-brand-950 pt-3">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-brand-950 uppercase">
              {tr("total", lang)}
            </span>
            <span className="text-xl font-normal text-brand-950">
              {formatMoney(totals.total, currency, lang, numerals)}
            </span>
          </div>
        </div>
      </div>

      {/* Payments */}
      {showPayments && payments.length > 0 && (
        <div className="mt-10">
          <p className="text-[9px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">
            {tr("payments", lang)}
          </p>
          <table className="mt-2 w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-neutral-300 text-neutral-400">
                <th className="py-1.5 text-start font-medium">{tr("paymentDate", lang)}</th>
                <th className="py-1.5 text-start font-medium">{tr("paymentMethod", lang)}</th>
                <th className="py-1.5 text-start font-medium">{tr("reference", lang)}</th>
                <th className="py-1.5 text-end font-medium">{tr("amount", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i} className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-500">{formatDate(p.date, lang, numerals)}</td>
                  <td className="py-2 text-neutral-500">{methodLabel(p.method, lang)}</td>
                  <td className="py-2 text-neutral-500">{p.reference ?? "—"}</td>
                  <td className="py-2 text-end text-brand-950">
                    {formatMoney(p.amount, currency, lang, numerals)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <div className="flex w-[62mm] items-center justify-between border-b border-neutral-300 pb-2">
              <span className="text-[10px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
                {tr("balanceDue", lang)}
              </span>
              <span className="text-base font-normal text-brand-950">
                {formatMoney(totals.balance, currency, lang, numerals)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {loc(lang, invoice.notes, invoice.notesAr) && (
        <div className="mt-12">
          <p className="text-[9px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">
            {tr("notes", lang)}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-neutral-600 whitespace-pre-line">
            {loc(lang, invoice.notes, invoice.notesAr)}
          </p>
        </div>
      )}

      <PaymentMethodsBlock data={data} />

      <p className="mt-16 text-center text-[10px] tracking-wide text-neutral-400">
        {tr("thankYou", lang)}
      </p>

      <VatBlock data={data} />
    </div>
  );
}

import { tr, methodLabel, STATUS_BADGE, type InvoiceDocumentData } from "@/components/invoice/types";
import { formatMoney, formatMoneyShort, formatDate } from "@/lib/format";
import VatBlock from "@/components/invoice/VatBlock";
import PaymentMethodsBlock from "@/components/invoice/PaymentMethodsBlock";
import HijriLine from "@/components/invoice/HijriLine";

/**
 * Side-by-side bilingual layout: English primary (LTR), Arabic secondary
 * (RTL). Both languages appear on every block.
 */
export default function BilingualTemplate(data: InvoiceDocumentData) {
  const { numerals, org, client, invoice, lines, totals, payments, status, showPayments } = data;
  const currency = invoice.currency;
  const badge = STATUS_BADGE[status];
  const isQuote = data.kind === "quote";
  const isCredit = data.kind === "credit_note";
  const secondaryDate = isQuote ? invoice.expiryDate : invoice.dueDate;

  const label = (key: string) => (
    <>
      <span className="block text-brand-950">{tr(key, "en")}</span>
      <span className="block text-neutral-500" dir="rtl">
        {tr(key, "ar")}
      </span>
    </>
  );

  const money = (minor: number) => formatMoney(minor, currency, "en", numerals);
  const moneyAr = (minor: number) => formatMoney(minor, currency, "ar", numerals);

  return (
    <div className="px-[16mm] py-[15mm]">
      {/* Header */}
      <div className="flex items-start justify-between gap-8 border-b-2 border-brand-900 pb-6">
        <div className="flex items-start gap-4">
          {org.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logoUrl} alt="" className="h-14 w-14 object-contain" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-900 text-2xl font-bold text-white">
              {(org.name ?? "").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xl font-bold leading-tight text-brand-950">{org.name}</p>
            <p className="text-lg font-semibold text-neutral-600" dir="rtl">
              {org.nameAr ?? org.name}
            </p>
            <p className="mt-1 max-w-[75mm] text-[11px] leading-relaxed text-neutral-500 whitespace-pre-line">
              {org.address ?? org.addressAr ?? ""}
            </p>
            {org.vatId && (
              <p className="mt-1 text-[11px] text-neutral-500">
                {tr("taxId", "en")} / {tr("taxId", "ar")}: {org.vatId}
              </p>
            )}
          </div>
        </div>

        <div className="text-end">
          <h1 className="text-[30px] font-extrabold leading-none tracking-tight text-brand-950">
            {tr(isCredit ? "creditNote" : isQuote ? "quote" : "invoice", "en")}
          </h1>
          <p className="mt-1 text-xl font-bold text-neutral-600" dir="rtl">
            {tr(isCredit ? "creditNote" : isQuote ? "quote" : "invoice", "ar")}
          </p>
          <div className="mt-3 space-y-1 text-[11px] text-neutral-600">
            <p>
              <span className="font-semibold">{tr("invoiceNumber", "en")} / {tr("invoiceNumber", "ar")}:</span>{" "}
              {invoice.number ?? "—"}
            </p>
            <p>
              <span className="font-semibold">{tr("issuedOn", "en")}:</span>{" "}
              {formatDate(invoice.issueDate, "en", numerals)}
              <span className="text-neutral-400" dir="rtl"> · {formatDate(invoice.issueDate, "ar", numerals)}</span>
            </p>
            {secondaryDate && (
              <p>
                <span className="font-semibold">
                  {tr(isQuote ? "expiryDate" : "dueDate", "en")}:
                </span>{" "}
                {formatDate(secondaryDate, "en", numerals)}
                <span className="text-neutral-400" dir="rtl"> · {formatDate(secondaryDate, "ar", numerals)}</span>
              </p>
            )}
          </div>
          <HijriLine date={invoice.issueDate} lang="ar" numerals={numerals} enabled={data.hijriDates} />
          <div className="mt-3 inline-block rounded-md border border-brand-200 bg-brand-50 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-brand-800 uppercase">
            {badge.en} · <span dir="rtl">{badge.ar}</span>
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="mt-6 grid grid-cols-2 gap-8">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
            {tr("billTo", "en")} / {tr("billTo", "ar")}
          </p>
          <p className="mt-2 text-base font-bold text-brand-950">{client.name}</p>
          {client.nameAr && (
            <p className="text-sm font-semibold text-neutral-600" dir="rtl">{client.nameAr}</p>
          )}
          <div className="mt-1 text-[11px] text-neutral-500">
            <p>{client.address ?? client.addressAr ?? ""}</p>
            {client.email && <p>{client.email}</p>}
            {client.phone && <p>{client.phone}</p>}
            {client.taxId && <p>{tr("taxId", "en")}: {client.taxId}</p>}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
            {tr("from", "en")} / {tr("from", "ar")}
          </p>
          <p className="mt-2 text-base font-bold text-brand-950">{org.name}</p>
          {org.nameAr && (
            <p className="text-sm font-semibold text-neutral-600" dir="rtl">{org.nameAr}</p>
          )}
          {org.bankDetails && (
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-500 whitespace-pre-line">
              {org.bankDetails}
            </p>
          )}
        </div>
      </div>

      {/* Items */}
      <table className="mt-8 w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b-2 border-brand-900">
            <th className="py-2.5 text-start text-[10px] font-semibold tracking-[0.14em] text-brand-950 uppercase">
              {tr("description", "en")} / {tr("description", "ar")}
            </th>
            <th className="py-2.5 text-center text-[10px] font-semibold tracking-[0.14em] text-brand-950 uppercase">
              {tr("quantity", "en")}
            </th>
            <th className="py-2.5 text-end text-[10px] font-semibold tracking-[0.14em] text-brand-950 uppercase">
              {tr("unitPrice", "en")}
            </th>
            <th className="py-2.5 text-end text-[10px] font-semibold tracking-[0.14em] text-brand-950 uppercase">
              {tr("amount", "en")}
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="border-b border-neutral-200 align-top">
              <td className="py-3 pe-3">
                <p className="font-medium text-brand-950">{line.description}</p>
                {line.descriptionAr && (
                  <p className="text-neutral-600" dir="rtl">{line.descriptionAr}</p>
                )}
              </td>
              <td className="py-3 text-center text-neutral-600">{formatMoneyShort(line.quantity, "en", numerals)}</td>
              <td className="py-3 text-end text-neutral-600">{money(line.unitPrice)}</td>
              <td className="py-3 text-end font-medium text-brand-950">{money(line.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-6 flex justify-end gap-6">
        <div className="w-[64mm]">
          {[
            { k: "subtotal", v: totals.subtotal },
            ...(totals.discountAmount > 0 ? [{ k: "discount", v: -totals.discountAmount }] : []),
            ...(totals.taxAmount > 0 ? [{ k: "tax", v: totals.taxAmount }] : []),
          ].map((row) => (
            <div key={row.k} className="flex items-center justify-between py-1.5 text-[11px] text-neutral-600">
              <span>{label(row.k)}</span>
              <span className="text-brand-950">{row.v < 0 ? `−${money(-row.v)}` : money(row.v)}</span>
            </div>
          ))}
          {totals.lateFee > 0 && (
            <div className="flex items-center justify-between py-1.5 text-[11px] text-red-600">
              <span>{label("lateFee")}</span>
              <span>{money(totals.lateFee)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between rounded-lg bg-brand-950 px-4 py-3 text-white">
            <span>
              <span className="block text-xs font-bold uppercase">{tr("total", "en")}</span>
              <span className="block text-[10px] text-white/70" dir="rtl">{tr("total", "ar")}</span>
            </span>
            <span className="text-base font-extrabold">{money(totals.total)}</span>
          </div>
          {showPayments && payments.length > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-brand-50 px-4 py-2.5">
              <span className="text-xs font-bold text-brand-900 uppercase">
                {tr("balanceDue", "en")} / {tr("balanceDue", "ar")}
              </span>
              <span className="text-sm font-extrabold text-brand-900">{money(totals.balance)}</span>
            </div>
          )}
        </div>
        <p className="self-end text-[11px] text-neutral-500" dir="rtl">
          {moneyAr(totals.total)}
        </p>
      </div>

      {/* Payments */}
      {showPayments && payments.length > 0 && (
        <div className="mt-8">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
            {tr("payments", "en")} / {tr("payments", "ar")}
          </p>
          <table className="mt-2 w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-neutral-300 text-neutral-500">
                <th className="py-1.5 text-start font-medium">{tr("paymentDate", "en")}</th>
                <th className="py-1.5 text-start font-medium">{tr("paymentMethod", "en")}</th>
                <th className="py-1.5 text-start font-medium">{tr("reference", "en")}</th>
                <th className="py-1.5 text-end font-medium">{tr("amount", "en")}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i} className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-600">{formatDate(p.date, "en", numerals)}</td>
                  <td className="py-2 text-neutral-600">
                    {methodLabel(p.method, "en")}
                    {methodLabel(p.method, "ar") !== methodLabel(p.method, "en") ? ` · ${methodLabel(p.method, "ar")}` : ""}
                  </td>
                  <td className="py-2 text-neutral-600">{p.reference ?? "—"}</td>
                  <td className="py-2 text-end text-brand-950">{money(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      {(invoice.notes || invoice.notesAr) && (
        <div className="mt-10 border-t border-neutral-200 pt-4">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
            {tr("notes", "en")} / {tr("notes", "ar")}
          </p>
          {invoice.notes && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-600 whitespace-pre-line">{invoice.notes}</p>
          )}
          {invoice.notesAr && (
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 whitespace-pre-line" dir="rtl">{invoice.notesAr}</p>
          )}
        </div>
      )}

      <PaymentMethodsBlock data={data} />

      <p className="mt-12 text-center text-[10px] text-neutral-400">
        {tr("thankYou", "en")} · <span dir="rtl">{tr("thankYou", "ar")}</span>
      </p>

      <VatBlock data={data} />
    </div>
  );
}

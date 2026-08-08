import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoiceForRender } from "@/lib/data";
import { toDocumentData } from "@/lib/render";
import { requireOrg } from "@/lib/auth";
import { createShareToken } from "@/lib/share";
import { effectiveStatus, STATUS_LABELS, STATUS_COLORS } from "@/lib/status";
import { formatMoney, formatDate, type Lang } from "@/lib/format";
import { convertedMinor } from "@/lib/rates";
import { getUiLang } from "@/lib/ui-lang";
import { u } from "@/lib/ui";
import { Card, Badge, ButtonLink } from "@/components/ui";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";
import InvoiceActions from "@/components/InvoiceActions";
import PaymentForm from "@/components/PaymentForm";
import PaymentsList from "@/components/PaymentsList";
import ShareInvoice from "@/components/ShareInvoice";
import ConvertQuoteButton from "@/components/ConvertQuoteButton";
import RecurringDialog from "@/components/RecurringDialog";
import CreditNoteDialog from "@/components/CreditNoteDialog";
import SignPdfPanel from "@/components/SignPdfPanel";
import { certCommonName } from "@/lib/pdfsign";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { org } = await requireOrg();
  const uiLang = await getUiLang();

  const data = await getInvoiceForRender(id, org.id);
  if (!data) notFound();

  const { invoice, totals } = data;
  const doc = toDocumentData(invoice, totals);
  const lang: Lang = doc.lang;
  const status = effectiveStatus(invoice, totals.paid, totals.total);
  const isQuote = invoice.kind === "quote";
  const shareToken = await createShareToken(invoice.id);
  const shareUrl = `/share/${shareToken}`;

  const reportCurrency = org.reportCurrency ?? org.defaultCurrency;
  const convertedTotal =
    invoice.currency !== reportCurrency
      ? await convertedMinor(totals.total, invoice.currency, reportCurrency)
      : null;

  const isActionable = status !== "draft" && status !== "cancelled";

  const details = [
    { label: u("client", uiLang), value: invoice.client.name, href: `/clients/${invoice.client.id}` },
    { label: u("issueDate", uiLang), value: formatDate(invoice.issueDate, lang, doc.numerals) },
    ...(invoice.dueDate ? [{ label: u("dueDate", uiLang), value: formatDate(invoice.dueDate, lang, doc.numerals) }] : []),
    { label: u("defaultCurrency", uiLang), value: invoice.currency },
    { label: u("invoiceLanguage", uiLang), value: invoice.lang === "ar" ? "العربية" : "English" },
    { label: u("taxName", uiLang), value: invoice.taxName || (invoice.taxRate ? "Tax" : "None") },
    {
      label: "Status",
      value: STATUS_LABELS[status][lang],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900">
              {invoice.number ?? `${u("draft", uiLang)} ${u("invoice", uiLang)}`}
            </h1>
            <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status][lang]}</Badge>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {invoice.client.name}
            {invoice.client.nameAr ? ` · ${invoice.client.nameAr}` : ""}
          </p>
        </div>
        <InvoiceActions invoiceId={invoice.id} status={status} lang={uiLang} />
      </div>

      {isActionable && (
        <div className="flex flex-wrap items-center gap-2">
          <ShareInvoice invoiceId={invoice.id} clientEmail={invoice.client.email} lang={uiLang} />
          <ButtonLink href={shareUrl} variant="secondary" target="_blank">
            View as client
          </ButtonLink>
          {isQuote ? (
            <ConvertQuoteButton invoiceId={invoice.id} toKind="invoice" lang={uiLang} />
          ) : invoice.kind === "credit_note" ? null : (
            <>
              <ConvertQuoteButton invoiceId={invoice.id} toKind="quote" lang={uiLang} />
              <RecurringDialog invoiceId={invoice.id} lang={uiLang} />
              {totals.paid > 0 && (
                <CreditNoteDialog
                  invoiceId={invoice.id}
                  paidMinor={totals.paid}
                  currency={invoice.currency}
                  lang={uiLang}
                />
              )}
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
              {details.map((d) => (
                <div key={d.label}>
                  <dt className="text-xs text-neutral-400">{d.label}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-neutral-900">
                    {d.href ? (
                      <Link href={d.href} className="hover:underline">
                        {d.value}
                      </Link>
                    ) : (
                      d.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-neutral-200 px-5 py-4">
              <h2 className="font-semibold text-neutral-900">{u("invoiceDocument", uiLang)}</h2>
              <p className="text-xs text-neutral-400">
                {u("invoiceDocHint", uiLang)}
              </p>
            </div>
            <div className="flex justify-center overflow-x-auto bg-neutral-100 p-6">
              <div className="shrink-0 shadow-xl ring-1 ring-neutral-900/10">
                <InvoiceDocument {...doc} />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-neutral-900">{u("summary", uiLang)}</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>{u("subtotal", uiLang)}</span>
                <span className="text-neutral-900">
                  {formatMoney(totals.subtotal, invoice.currency, lang, doc.numerals)}
                </span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-neutral-500">
                  <span>{u("discount", uiLang)}</span>
                  <span className="text-red-600">
                    −{formatMoney(totals.discountAmount, invoice.currency, lang, doc.numerals)}
                  </span>
                </div>
              )}
              {totals.taxAmount > 0 && (
                <div className="flex justify-between text-neutral-500">
                  <span>{u("taxName", uiLang)}{invoice.taxInclusive ? ` (${u("taxIncluded", uiLang)})` : ""}</span>
                  <span className="text-neutral-900">
                    {formatMoney(totals.taxAmount, invoice.currency, lang, doc.numerals)}
                  </span>
                </div>
              )}
              {totals.lateFee > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{u("lateFee", uiLang)}{totals.lateFeePercent ? ` (${totals.lateFeePercent}%)` : ""}</span>
                  <span>{formatMoney(totals.lateFee, invoice.currency, lang, doc.numerals)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-neutral-200 pt-2.5 text-base font-bold text-neutral-900">
                <span>{u("total", uiLang)}</span>
                <span>{formatMoney(totals.total, invoice.currency, lang, doc.numerals)}</span>
              </div>
              {convertedTotal !== null && (
                <p className="pt-1 text-end text-xs text-neutral-400">
                  ≈ {formatMoney(convertedTotal, reportCurrency, lang, doc.numerals)}
                </p>
              )}
              {isActionable && (
                <>
                  <div className="flex justify-between text-emerald-700">
                    <span>{u("paid", uiLang)}</span>
                    <span>{formatMoney(totals.paid, invoice.currency, lang, doc.numerals)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>{u("balance", uiLang)}</span>
                    <span>{formatMoney(totals.balance, invoice.currency, lang, doc.numerals)}</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {isActionable && !isQuote && (
            <Card className="p-5">
              <h2 className="mb-3 font-semibold text-neutral-900">{u("recordPayment", uiLang)}</h2>
              <PaymentForm
                invoiceId={invoice.id}
                balance={totals.balance}
                currency={invoice.currency}
                methods={JSON.parse(org.paymentMethods ?? "[]") as string[]}
                lang={uiLang}
              />
            </Card>
          )}

          {isActionable && !isQuote && totals.paid > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 font-semibold text-neutral-900">{u("payments", uiLang)}</h2>
              <PaymentsList
                invoiceId={invoice.id}
                payments={invoice.payments.map((p) => ({
                  id: p.id,
                  amount: p.amount,
                  method: p.method,
                  date: p.date.toISOString(),
                  reference: p.reference,
                }))}
                currency={invoice.currency}
                lang={lang}
                uiLang={uiLang}
              />
            </Card>
          )}

          {isActionable && (
            <SignPdfPanel
              invoiceId={invoice.id}
              configured={Boolean(org.signKey && org.signCert)}
              signed={Boolean(invoice.signedPdf)}
              signer={org.signCert ? certCommonName(org.signCert) : null}
              signedAt={invoice.signedAt ? invoice.signedAt.toISOString() : null}
              verifyUrl={`/share/${shareToken}/verify`}
              lang={uiLang}
            />
          )}
        </div>
      </div>
    </div>
  );
}

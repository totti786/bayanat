import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { computeTotals } from "@/lib/totals";
import { getUiLang } from "@/lib/ui-lang";
import { formatMoney, type Numerals } from "@/lib/format";
import { Card } from "@/components/ui";
import { u } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { org } = await requireOrg();
  const uiLang = await getUiLang();
  const { from, to } = await searchParams;

  const numerals: Numerals = org.numerals === "eastern" ? "eastern" : "western";

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const defaultTo = now.toISOString().slice(0, 10);
  const fromDate = new Date(from ?? defaultFrom);
  const toDate = new Date(to ?? defaultTo);
  toDate.setHours(23, 59, 59, 999);

  const invoices = await prisma.invoice.findMany({
    where: {
      orgId: org.id,
      kind: "invoice",
      status: { notIn: ["draft", "cancelled"] },
      issueDate: { gte: fromDate, lte: toDate },
    },
    include: { items: true },
    orderBy: { issueDate: "asc" },
  });

  const byRate = new Map<number, { taxable: number; tax: number; count: number }>();
  let totalTaxable = 0;
  let totalTax = 0;

  for (const inv of invoices) {
    const t = computeTotals(inv, inv.items);
    const rate = inv.taxRate ?? 0;
    const entry = byRate.get(rate) ?? { taxable: 0, tax: 0, count: 0 };
    entry.taxable += t.subtotal;
    entry.tax += t.taxAmount;
    entry.count += 1;
    byRate.set(rate, entry);
    totalTaxable += t.subtotal;
    totalTax += t.taxAmount;
  }

  const money = (minor: number) => formatMoney(minor, org.defaultCurrency, "en", numerals);
  const currency = org.defaultCurrency;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{u("invoices", uiLang)} · VAT report</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {uiLang === "ar" ? "ملخص ضريبة القيمة المضافة للفترة" : "VAT summary for the selected period"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/export/invoices" className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
            Invoices CSV
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/export/payments" className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
            Payments CSV
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/export/clients" className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
            Clients CSV
          </a>
        </div>
      </div>

      <form action="/reports" method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-neutral-600">
          {uiLang === "ar" ? "من" : "From"}
          <input type="date" name="from" defaultValue={from ?? defaultFrom} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-600">
          {uiLang === "ar" ? "إلى" : "To"}
          <input type="date" name="to" defaultValue={to ?? defaultTo} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
          {uiLang === "ar" ? "عرض" : "Apply"}
        </button>
      </form>

      <Card>
        {byRate.size === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-500">
            {uiLang === "ar" ? "لا توجد فواتير في هذه الفترة" : "No invoices in this period"}
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
                <th className="px-5 py-3 font-medium">VAT rate</th>
                <th className="px-5 py-3 text-end font-medium">Invoices</th>
                <th className="px-5 py-3 text-end font-medium">Taxable</th>
                <th className="px-5 py-3 text-end font-medium">VAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {[...byRate.entries()].sort((a, b) => a[0] - b[0]).map(([rate, e]) => (
                <tr key={rate}>
                  <td className="px-5 py-3 font-medium text-neutral-900">{rate}%</td>
                  <td className="px-5 py-3 text-end text-neutral-600">{e.count}</td>
                  <td className="px-5 py-3 text-end text-neutral-900">{money(e.taxable)}</td>
                  <td className="px-5 py-3 text-end text-neutral-900">{money(e.tax)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-neutral-900 font-semibold">
                <td className="px-5 py-3 text-neutral-900">{uiLang === "ar" ? "الإجمالي" : "Total"}</td>
                <td className="px-5 py-3 text-end">{invoices.length}</td>
                <td className="px-5 py-3 text-end">{money(totalTaxable)}</td>
                <td className="px-5 py-3 text-end">{money(totalTax)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </Card>

      <p className="text-xs text-neutral-400">
        {uiLang === "ar"
          ? "أرقام بالعملة: " + currency
          : `All amounts in ${currency}. Not a substitute for a formal tax return.`}
      </p>
    </div>
  );
}

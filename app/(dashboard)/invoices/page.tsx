import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { computeTotals, withPayments } from "@/lib/totals";
import { effectiveStatus, STATUS_LABELS, STATUS_COLORS } from "@/lib/status";
import { formatMoney, formatDate, type Lang, type Numerals } from "@/lib/format";
import { Card, Badge, ButtonLink } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { getUiLang } from "@/lib/ui-lang";
import { u } from "@/lib/ui";
import { InvoiceStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const FILTERS = ["all", "draft", "sent", "partially_paid", "paid", "overdue"] as const;
const PAGE_SIZE = 25;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status: filter, q, page: pageParam } = await searchParams;
  const { org } = await requireOrg();
  const uiLang = await getUiLang();
  const page = Math.max(1, Number(pageParam) || 1);

  const statusWhere =
    filter === "overdue"
      ? {
          status: InvoiceStatus.sent,
          dueDate: { lt: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })() },
        }
      : filter && filter !== "all"
        ? { status: filter as InvoiceStatus }
        : {};

  const where = {
    orgId: org.id,
    ...statusWhere,
    ...(q
      ? {
          OR: [
            { number: { contains: q } },
            { client: { name: { contains: q } } },
          ],
        }
      : {}),
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { items: true, payments: true, client: true },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.invoice.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const numerals: Numerals = org.numerals === "eastern" ? "eastern" : "western";
  const langOf = (l: string): Lang => (l === "ar" ? "ar" : "en");

  const rows = invoices.map((inv) => {
    const totals = withPayments(computeTotals(inv, inv.items), inv.payments, {
      lateFeePercent: org.lateFeePercent,
      invoice: inv,
    });
    const status = effectiveStatus(inv, totals.paid, totals.total);
    return { inv, totals, status };
  });

  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    if (filter && filter !== "all") sp.set("status", filter);
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/invoices?${qs}` : "/invoices";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{u("invoices", uiLang)}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {total} invoice{total === 1 ? "" : "s"}
          </p>
        </div>
        <ButtonLink href="/invoices/new">{u("newInvoice", uiLang)}</ButtonLink>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form action="/invoices" method="get" className="w-full max-w-xs">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={u("searchNumberOrClient", uiLang)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </form>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={f === "all" ? buildHref(1) : `/invoices?status=${f}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                (filter ?? "all") === f
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {f === "all" ? u("all", uiLang) : STATUS_LABELS[f][uiLang]}
            </Link>
          ))}
        </div>
      </div>

      <Card>
        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-neutral-500">{u("noInvoices", uiLang)}</p>
            <ButtonLink href="/invoices/new" variant="secondary" className="mt-3">
              Create one
            </ButtonLink>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-400">
                    <th className="px-5 py-3 font-medium">{u("invoiceNumber", uiLang)}</th>
                    <th className="px-5 py-3 font-medium">{u("client", uiLang)}</th>
                    <th className="px-5 py-3 font-medium">{u("issueDate", uiLang)}</th>
                    <th className="px-5 py-3 font-medium">{u("status", uiLang)}</th>
                    <th className="px-5 py-3 text-end font-medium">{u("total", uiLang)}</th>
                    <th className="px-5 py-3 text-end font-medium">{u("balance", uiLang)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rows.map(({ inv, totals, status }) => (
                    <tr key={inv.id} className="transition-colors hover:bg-neutral-50">
                      <td className="px-5 py-3.5">
                        <Link href={`/invoices/${inv.id}`} className="font-medium text-neutral-900 hover:underline">
                          {inv.number ?? "Draft"}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-600">{inv.client.name}</td>
                      <td className="px-5 py-3.5 text-neutral-600">{formatDate(inv.issueDate, langOf(inv.lang), numerals)}</td>
                      <td className="px-5 py-3.5">
                        <Badge className={STATUS_COLORS[status]}>
                          {STATUS_LABELS[status][langOf(inv.lang)]}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-end font-semibold text-neutral-900">
                        {formatMoney(totals.total, inv.currency, langOf(inv.lang), numerals)}
                      </td>
                      <td className={`px-5 py-3.5 text-end font-medium ${totals.balance > 0 ? "text-amber-700" : "text-neutral-400"}`}>
                        {formatMoney(totals.balance, inv.currency, langOf(inv.lang), numerals)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
          </>
        )}
      </Card>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { computeTotals, withPayments } from "@/lib/totals";
import { effectiveStatus, STATUS_LABELS, STATUS_COLORS } from "@/lib/status";
import { formatMoney, formatDate, type Numerals } from "@/lib/format";
import { loadRates, convertMinor } from "@/lib/rates";
import { getUiLang } from "@/lib/ui-lang";
import { u } from "@/lib/ui";
import { Card, Badge, ButtonLink } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { org } = await requireOrg();
  const uiLang = await getUiLang();

  const invoices = await prisma.invoice.findMany({
    where: { orgId: org.id },
    include: { items: true, payments: true, client: true },
    orderBy: { createdAt: "desc" },
  });

  const numerals: Numerals = org.numerals === "eastern" ? "eastern" : "western";
  const reportCurrency = org.reportCurrency ?? org.defaultCurrency;
  const rates = await loadRates(reportCurrency);

  const toReport = (minor: number, currency: string) =>
    convertMinor(minor, currency, reportCurrency, rates) ?? minor;

  const rows = invoices.map((inv) => {
    const totals = withPayments(computeTotals(inv, inv.items), inv.payments, {
      lateFeePercent: org.lateFeePercent,
      invoice: inv,
    });
    const status = effectiveStatus(inv, totals.paid, totals.total);
    return {
      inv,
      totals,
      status,
      balanceReport: toReport(totals.balance, inv.currency),
      totalReport: toReport(totals.total, inv.currency),
      paidReport: toReport(totals.paid, inv.currency),
    };
  });

  const open = rows.filter(
    (r) => r.status === "sent" || r.status === "partially_paid" || r.status === "overdue"
  );
  const outstanding = open.reduce((s, r) => s + r.balanceReport, 0);
  const overdueAmount = rows
    .filter((r) => r.status === "overdue")
    .reduce((s, r) => s + r.balanceReport, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthInvoices = rows.filter(
    (r) => r.inv.createdAt >= monthStart && r.inv.status !== "cancelled"
  );
  const invoicedThisMonth = monthInvoices.reduce((s, r) => s + r.totalReport, 0);
  const collectedThisMonth = monthInvoices.reduce((s, r) => s + r.paidReport, 0);

  // Outstanding by client (in report currency)
  const byClient = new Map<
    string,
    { client: (typeof invoices)[number]["client"]; outstanding: number; count: number }
  >();
  for (const r of open) {
    const entry = byClient.get(r.inv.clientId) ?? {
      client: r.inv.client,
      outstanding: 0,
      count: 0,
    };
    entry.outstanding += r.balanceReport;
    entry.count += 1;
    byClient.set(r.inv.clientId, entry);
  }
  const topClients = [...byClient.values()].sort((a, b) => b.outstanding - a.outstanding);

  const stats = [
    {
      label: u("outstanding", uiLang),
      value: formatMoney(outstanding, reportCurrency, "en", numerals),
      sub: `${open.length} ${u("openInvoices", uiLang)}`,
      color: "text-neutral-900",
    },
    {
      label: u("overdue", uiLang),
      value: formatMoney(overdueAmount, reportCurrency, "en", numerals),
      sub: `${rows.filter((r) => r.status === "overdue").length} ${u("overdue", uiLang)}`,
      color: "text-red-600",
    },
    {
      label: u("invoicedMonth", uiLang),
      value: formatMoney(invoicedThisMonth, reportCurrency, "en", numerals),
      sub: `${monthInvoices.length} ${u("invoices", uiLang)}`,
      color: "text-neutral-900",
    },
    {
      label: u("collectedMonth", uiLang),
      value: formatMoney(collectedThisMonth, reportCurrency, "en", numerals),
      sub: u("fromPayments", uiLang),
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{u("dashboard", uiLang)}</h1>
          <p className="mt-1 text-sm text-neutral-500">{u("snapshot", uiLang)}</p>
        </div>
        <ButtonLink href="/invoices/new">{u("newInvoice", uiLang)}</ButtonLink>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-neutral-500">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-xs text-neutral-400">{s.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Recent invoices</h2>
            <Link href="/invoices" className="text-sm font-medium text-neutral-500 hover:text-neutral-900">
              View all →
            </Link>
          </div>
          {rows.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-neutral-500">{u("noInvoicesYet", uiLang)}</p>
              <ButtonLink href="/invoices/new" variant="secondary" className="mt-3">
                Create your first invoice
              </ButtonLink>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {rows.slice(0, 6).map(({ inv, totals, status }) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between py-3 transition-colors hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {inv.number ?? "Draft"} · {inv.client.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatDate(inv.issueDate, uiLang, numerals)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge className={STATUS_COLORS[status]}>
                      {STATUS_LABELS[status][uiLang]}
                    </Badge>
                    <span className="text-sm font-semibold text-neutral-900">
                      {formatMoney(totals.total, inv.currency, uiLang, numerals)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-neutral-900">{u("outstandingByClient", uiLang)}</h2>
          {topClients.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-500">
              {u("allCaughtUp", uiLang)}
            </p>
          ) : (
            <div className="space-y-3">
              {topClients.slice(0, 6).map(({ client, outstanding: bal, count }) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-neutral-50"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{client.name}</p>
                    <p className="text-xs text-neutral-500">
                      {count} open invoice{count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">
                    {formatMoney(bal, reportCurrency, "en", numerals)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

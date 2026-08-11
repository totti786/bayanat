import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { computeTotals, withPayments } from "@/lib/totals";
import { effectiveStatus, STATUS_LABELS, STATUS_COLORS } from "@/lib/status";
import { formatMoney, formatDate, type Numerals } from "@/lib/format";
import { Card, Badge, ButtonLink } from "@/components/ui";
import { getUiLang } from "@/lib/ui-lang";
import { u } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { org } = await requireOrg();
  const uiLang = await getUiLang();

  const client = await prisma.client.findFirst({
    where: { id, orgId: org.id },
    include: {
      invoices: {
        include: { items: true, payments: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!client) notFound();

  const numerals: Numerals = org.numerals === "eastern" ? "eastern" : "western";

  const rows = client.invoices.map((inv) => {
    const totals = withPayments(computeTotals(inv, inv.items), inv.payments, {
      lateFeePercent: org.lateFeePercent,
      invoice: inv,
    });
    const status = effectiveStatus(inv, totals.paid, totals.total);
    return { inv, totals, status };
  });

  const open = rows.filter(
    (r) => r.status === "sent" || r.status === "partially_paid" || r.status === "overdue"
  );
  const outstanding = open.reduce((s, r) => s + r.totals.balance, 0);
  const totalBilled = rows
    .filter((r) => r.inv.status !== "cancelled")
    .reduce((s, r) => s + r.totals.total, 0);

  const info = [
    [u("email", uiLang), client.email],
    [u("phone", uiLang), client.phone],
    [u("taxId", uiLang), client.taxId],
    [u("invoiceLanguage", uiLang), client.language === "ar" ? "العربية" : "English"],
    [u("paymentTerms", uiLang), client.paymentTerms ? `${client.paymentTerms} days` : "—"],
    [u("defaultCurrency", uiLang), client.currency ?? "—"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {client.name}
            {client.nameAr && (
              <span className="ml-3 text-xl font-normal text-neutral-400" dir="rtl">
                {client.nameAr}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {(client.address ?? client.addressAr ?? "No address")}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <ButtonLink href={`/clients/${client.id}/edit`} variant="secondary">
            Edit
          </ButtonLink>
          <ButtonLink href={`/invoices/new?clientId=${client.id}`} variant="secondary">
            New invoice
          </ButtonLink>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-neutral-500">{u("outstanding", uiLang)}</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {formatMoney(outstanding, client.currency ?? org.defaultCurrency, "en", numerals)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-neutral-500">{u("totalBilled", uiLang)}</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">
            {formatMoney(totalBilled, client.currency ?? org.defaultCurrency, "en", numerals)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-neutral-500">{u("invoices", uiLang)}</p>
          <p className="mt-1 text-xl font-bold text-neutral-900">{rows.length}</p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold text-neutral-900">{u("contactBilling", uiLang)}</h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {info.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-neutral-100 pb-2 text-sm">
              <dt className="text-neutral-500">{k}</dt>
              <dd className="font-medium text-neutral-900 text-end">{v ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <div className="border-b border-neutral-100 px-5 py-4">
          <h2 className="font-semibold text-neutral-900">{u("invoices", uiLang)}</h2>
        </div>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">{u("noInvoicesForClient", uiLang)}</p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {rows.map(({ inv, totals, status }) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-neutral-50"
              >
                <div>
                  <p className="font-medium text-neutral-900">{inv.number ?? u("draft", uiLang)}</p>
                  <p className="text-xs text-neutral-500">{formatDate(inv.issueDate, uiLang, numerals)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status][uiLang]}</Badge>
                  <span className="w-32 text-end font-semibold text-neutral-900">
                    {formatMoney(totals.total, inv.currency, uiLang, numerals)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

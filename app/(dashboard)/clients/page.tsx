import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { computeTotals, withPayments } from "@/lib/totals";
import { formatMoney, type Numerals } from "@/lib/format";
import { Card, ButtonLink } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { getUiLang } from "@/lib/ui-lang";
import { u } from "@/lib/ui";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 25;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const { org } = await requireOrg();
  const uiLang = await getUiLang();
  const page = Math.max(1, Number(pageParam) || 1);
  const numerals: Numerals = org.numerals === "eastern" ? "eastern" : "western";

  const where = {
    orgId: org.id,
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { nameAr: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {}),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        invoices: {
          include: { items: true, payments: true },
        },
      },
      orderBy: { name: "asc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.client.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rows = clients.map((client) => {
    const open = client.invoices.filter(
      (inv) =>
        inv.status !== "draft" && inv.status !== "cancelled" && inv.status !== "paid"
    );
    const outstanding = open.reduce((s, inv) => {
      const t = withPayments(computeTotals(inv, inv.items), inv.payments, {
        lateFeePercent: org.lateFeePercent,
        invoice: inv,
      });
      return s + (t.balance > 0 ? t.balance : 0);
    }, 0);
    const count = client.invoices.length;
    return { client, outstanding, count };
  });

  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/clients?${qs}` : "/clients";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{u("clients", uiLang)}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {total} client{total === 1 ? "" : "s"}
          </p>
        </div>
        <ButtonLink href="/clients/new">{u("newClient", uiLang)}</ButtonLink>
      </div>

      <form action="/clients" method="get" className="w-full max-w-xs">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={u("searchClients", uiLang)}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
        />
      </form>

      <Card>
        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-neutral-500">{u("noClients", uiLang)}</p>
            <ButtonLink href="/clients/new" variant="secondary" className="mt-3">
              Add your first client
            </ButtonLink>
          </div>
        ) : (
          <>
            <div className="divide-y divide-neutral-100">
              {rows.map(({ client, outstanding, count }) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-900">
                      {client.name}
                      {client.nameAr ? <span className="ml-2 text-sm font-normal text-neutral-400" dir="rtl">{client.nameAr}</span> : null}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {count} invoice{count === 1 ? "" : "s"}
                      {client.email ? ` · ${client.email}` : ""}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-semibold text-neutral-900">
                      {formatMoney(outstanding, client.currency ?? org.defaultCurrency, "en", numerals)}
                    </p>
                    <p className="text-xs text-neutral-400">{u("outstanding", uiLang)}</p>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
          </>
        )}
      </Card>
    </div>
  );
}

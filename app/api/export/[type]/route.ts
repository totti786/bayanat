import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { computeTotals, withPayments } from "@/lib/totals";
import { fromMinor } from "@/lib/money";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const esc = (v: unknown): string => {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/export/[type]">
) {
  const { type } = await ctx.params;
  const { org } = await requireOrg();
  const clientId = req.nextUrl.searchParams.get("clientId") ?? undefined;

  let csv = "";
  let filename = "";

  if (type === "invoices") {
    filename = "invoices.csv";
    csv = [
      ["Number", "Client", "Issue Date", "Currency", "Total", "Paid", "Balance", "Status"].map(esc).join(","),
      ...(await prisma.invoice.findMany({
        where: { orgId: org.id, ...(clientId ? { clientId } : {}) },
        include: { client: true, items: true, payments: true },
        orderBy: { createdAt: "asc" },
      })).map((inv) => {
        const t = withPayments(computeTotals(inv, inv.items), inv.payments, {
          lateFeePercent: org.lateFeePercent,
          invoice: inv,
        });
        return [
          inv.number ?? "Draft",
          inv.client.name,
          inv.issueDate.toISOString().slice(0, 10),
          inv.currency,
          fromMinor(t.total, inv.currency),
          fromMinor(t.paid, inv.currency),
          fromMinor(t.balance, inv.currency),
          inv.status,
        ].map(esc).join(",");
      }),
    ].join("\n");
  } else if (type === "payments") {
    filename = "payments.csv";
    const payments = await prisma.payment.findMany({
      where: { invoice: { orgId: org.id, ...(clientId ? { clientId } : {}) } },
      include: { invoice: { include: { client: true } } },
      orderBy: { date: "asc" },
    });
    csv = [
      ["Date", "Invoice", "Client", "Method", "Reference", "Currency", "Amount"].map(esc).join(","),
      ...payments.map((p) => [
        p.date.toISOString().slice(0, 10),
        p.invoice.number ?? "—",
        p.invoice.client.name,
        p.method,
        p.reference ?? "",
        p.invoice.currency,
        fromMinor(p.amount, p.invoice.currency),
      ].map(esc).join(",")),
    ].join("\n");
  } else if (type === "clients") {
    filename = "clients.csv";
    csv = [
      ["Name", "Email", "Phone", "Tax ID", "Currency", "Language"].map(esc).join(","),
      ...(await prisma.client.findMany({ where: { orgId: org.id }, orderBy: { name: "asc" } })).map((c) =>
        [c.name, c.email, c.phone, c.taxId, c.currency, c.language].map(esc).join(",")
      ),
    ].join("\n");
  } else if (type === "statement") {
    if (!clientId) return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
    filename = "statement.csv";
    const client = await prisma.client.findFirst({ where: { id: clientId, orgId: org.id } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    const invoices = await prisma.invoice.findMany({
      where: { orgId: org.id, clientId, status: { not: "draft" } },
      include: { items: true, payments: true },
      orderBy: { issueDate: "asc" },
    });
    const rows: (string | number)[][] = [];
    let running = 0;
    for (const inv of invoices) {
      const t = withPayments(computeTotals(inv, inv.items), inv.payments, {
        lateFeePercent: org.lateFeePercent,
        invoice: inv,
      });
      running += t.total - t.paid;
      rows.push([inv.issueDate.toISOString().slice(0, 10), inv.number ?? "", `Invoice ${inv.number ?? ""}`, inv.currency, fromMinor(t.total, inv.currency), fromMinor(t.paid, inv.currency), fromMinor(running, inv.currency)]);
    }
    csv = [
      ["Date", "Reference", "Description", "Currency", "Amount", "Paid", "Balance"].map(esc).join(","),
      ...rows.map((r) => r.map(esc).join(",")),
    ].join("\n");
  } else {
    return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

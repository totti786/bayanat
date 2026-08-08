import "server-only";

import { prisma } from "@/lib/db";
import { computeTotals, withPayments } from "@/lib/totals";
import type { Lang, Numerals } from "@/lib/format";

export interface InvoiceRenderData {
  invoice: NonNullable<Awaited<ReturnType<typeof loadInvoiceById>>>;
  totals: ReturnType<typeof computeTotals>;
}

export async function loadInvoiceById(invoiceId: string, orgId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, orgId },
    include: {
      client: true,
      org: true,
      items: true,
      payments: { orderBy: { date: "asc" } },
    },
  });
}

/** Public lookup for share links — access is controlled by the signed token. */
export async function loadInvoicePublic(invoiceId: string) {
  return prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: true,
      org: true,
      items: true,
      payments: { orderBy: { date: "asc" } },
    },
  });
}

export async function getInvoiceForRenderPublic(
  invoiceId: string
): Promise<InvoiceRenderData | null> {
  const invoice = await loadInvoicePublic(invoiceId);
  if (!invoice) return null;

  const base = computeTotals(invoice, invoice.items);
  const totals = withPayments(base, invoice.payments, {
    lateFeePercent: invoice.org.lateFeePercent,
    invoice,
  });
  return { invoice, totals };
}

export async function getInvoiceForRender(
  invoiceId: string,
  orgId: string
): Promise<InvoiceRenderData | null> {
  const invoice = await loadInvoiceById(invoiceId, orgId);
  if (!invoice) return null;

  const base = computeTotals(invoice, invoice.items);
  const totals = withPayments(base, invoice.payments, {
    lateFeePercent: invoice.org.lateFeePercent,
    invoice,
  });
  return { invoice, totals };
}

export function invoiceLang(invoice: { lang: string }, org: { numerals: string }): {
  lang: Lang;
  numerals: Numerals;
} {
  const lang = invoice.lang === "ar" ? "ar" : "en";
  const numerals: Numerals = org.numerals === "eastern" ? "eastern" : "western";
  return { lang, numerals };
}

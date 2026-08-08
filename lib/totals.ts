import type { Invoice, LineItem, Payment } from "@/generated/prisma/client";
import { effectiveStatus } from "@/lib/status";

export interface LineTotals {
  quantity: number;
  unitPrice: number; // minor units
  net: number; // minor units
  tax: number; // minor units
  total: number; // minor units
}

export interface InvoiceTotals {
  lines: LineTotals[];
  subtotal: number; // minor units
  discountAmount: number; // minor units
  taxAmount: number; // minor units
  total: number; // minor units
  paid: number; // minor units
  balance: number; // minor units
  lateFee: number; // minor units
  lateFeePercent: number;
  taxRate: number;
}

function num(n: number | string | null | undefined): number {
  return typeof n === "number" ? n : Number(n ?? 0);
}

function ri(n: number): number {
  return Math.round(n + Number.EPSILON);
}

export function computeTotals(
  invoice: Pick<
    Invoice,
    "discountType" | "discountValue" | "taxRate" | "taxInclusive"
  >,
  items: Pick<LineItem, "quantity" | "unitPrice" | "taxRate">[]
): InvoiceTotals {
  const invoiceRate = num(invoice.taxRate);
  const inclusive = invoice.taxInclusive;

  const lines: LineTotals[] = items.map((item) => {
    const qty = num(item.quantity);
    const unit = ri(num(item.unitPrice)); // minor units
    const lineRate = item.taxRate == null ? null : num(item.taxRate);
    const rate = (lineRate ?? invoiceRate) / 100;

    const gross = ri(unit * qty);

    let net: number;
    let tax: number;
    if (inclusive) {
      net = ri(gross / (1 + rate));
      tax = gross - net;
    } else {
      net = gross;
      tax = ri(gross * rate);
    }

    return {
      quantity: qty,
      unitPrice: unit,
      net,
      tax,
      total: net + tax,
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.net, 0);
  const taxAmount = lines.reduce((s, l) => s + l.tax, 0);

  let discountAmount = 0;
  if (invoice.discountType === "percentage") {
    discountAmount = ri((subtotal * num(invoice.discountValue)) / 100);
  } else if (invoice.discountType === "fixed") {
    discountAmount = Math.min(ri(num(invoice.discountValue)), subtotal + taxAmount);
  }

  const total = subtotal + taxAmount - discountAmount;

  return {
    lines,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    paid: 0,
    balance: total,
    lateFee: 0,
    lateFeePercent: 0,
    taxRate: invoiceRate,
  };
}

export function paidAmount(payments: Pick<Payment, "amount">[]): number {
  return payments.reduce((s, p) => s + num(p.amount), 0);
}

/**
 * Apply payments and an optional one-time late fee on overdue invoices.
 * The late fee is a percentage of the outstanding amount, added once the
 * invoice is overdue, and is included in the resulting balance.
 */
export function withPayments(
  totals: InvoiceTotals,
  payments: Pick<Payment, "amount">[],
  opts?: {
    lateFeePercent?: number;
    invoice?: Pick<Invoice, "status" | "dueDate" | "kind">;
  }
): InvoiceTotals {
  const paid = paidAmount(payments);
  let balance = totals.total - paid;
  let lateFee = 0;
  let lateFeePercent = 0;

  if (
    opts?.lateFeePercent &&
    opts.lateFeePercent > 0 &&
    opts.invoice &&
    effectiveStatus(opts.invoice, paid, totals.total) === "overdue"
  ) {
    lateFeePercent = opts.lateFeePercent;
    lateFee = Math.round((totals.total - paid) * (opts.lateFeePercent / 100));
    balance += lateFee;
  }

  return { ...totals, paid, balance, lateFee, lateFeePercent };
}

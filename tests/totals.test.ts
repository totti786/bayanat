import { describe, it, expect } from "vitest";
import { computeTotals, withPayments, paidAmount } from "@/lib/totals";
import { toMinor } from "@/lib/money";
import type { InvoiceStatus } from "@/generated/prisma/client";

const overdueInvoice = {
  status: "sent" as InvoiceStatus,
  kind: "invoice" as const,
  dueDate: new Date(Date.now() - 5 * 86400000),
};
const futureInvoice = {
  status: "sent" as InvoiceStatus,
  kind: "invoice" as const,
  dueDate: new Date(Date.now() + 10 * 86400000),
};

const inv = {
  discountType: "none",
  discountValue: null,
  taxRate: 5,
  taxInclusive: false,
};

const item = (unitPrice: number, quantity = 1, taxRate?: number | null) => ({
  unitPrice,
  quantity,
  taxRate: taxRate ?? null,
});

describe("computeTotals", () => {
  it("exclusive VAT adds tax on top", () => {
    const t = computeTotals(inv, [item(toMinor(1000, "AED"))]);
    expect(t.subtotal).toBe(100000);
    expect(t.taxAmount).toBe(5000);
    expect(t.total).toBe(105000);
  });

  it("inclusive VAT splits price into net + tax", () => {
    const t = computeTotals(
      { ...inv, taxInclusive: true },
      [item(toMinor(1050, "AED"))]
    );
    expect(t.subtotal).toBe(100000);
    expect(t.taxAmount).toBe(5000);
    expect(t.total).toBe(105000);
  });

  it("handles quantities and line-level tax overrides", () => {
    const t = computeTotals(inv, [
      item(toMinor(100, "AED"), 3, null),
      item(toMinor(200, "AED"), 2, 0),
    ]);
    expect(t.subtotal).toBe(70000);
    expect(t.taxAmount).toBe(1500); // only the first line is taxed
    expect(t.total).toBe(71500);
  });

  it("percentage discount applies to subtotal", () => {
    const t = computeTotals(
      { ...inv, discountType: "percentage", discountValue: 10 },
      [item(toMinor(1000, "AED"))]
    );
    expect(t.discountAmount).toBe(10000);
    expect(t.total).toBe(95000);
  });

  it("fixed discount caps at total", () => {
    const t = computeTotals(
      { ...inv, discountType: "fixed", discountValue: toMinor(100000, "AED") },
      [item(toMinor(500, "AED"))]
    );
    expect(t.discountAmount).toBe(52500); // caps at subtotal + tax
    expect(t.total).toBe(0);
  });

  it("rounds fractional money to the nearest unit", () => {
    // 33.33 x 3 = 99.99 exactly representable in cents
    const t = computeTotals(inv, [item(toMinor(33.33, "AED"), 3)]);
    expect(t.subtotal).toBe(9999);
  });

  it("inclusive rounding is consistent (2 x 1000 @ 5%)", () => {
    const t = computeTotals(
      { ...inv, taxInclusive: true },
      [item(toMinor(1000, "AED"), 2)]
    );
    // net = 2000/1.05 = 1904.76, tax = 95.24
    expect(t.subtotal).toBe(190476);
    expect(t.taxAmount).toBe(9524);
    expect(t.total).toBe(200000);
  });
});

describe("withPayments", () => {
  it("computes paid and balance", () => {
    const t = withPayments(computeTotals(inv, [item(toMinor(1000, "AED"))]), [
      { amount: toMinor(400, "AED") },
    ]);
    expect(t.paid).toBe(40000);
    expect(t.balance).toBe(65000);
  });

  it("paidAmount sums minor units", () => {
    expect(paidAmount([{ amount: 100 }, { amount: 200 }])).toBe(300);
  });

  it("adds a late fee on overdue invoices", () => {
    const t = withPayments(computeTotals(inv, [item(toMinor(1000, "AED"))]), [], {
      lateFeePercent: 2,
      invoice: overdueInvoice,
    });
    expect(t.lateFee).toBe(2100); // 2% of 105000 (incl. VAT)
    expect(t.balance).toBe(107100);
    expect(t.lateFeePercent).toBe(2);
  });

  it("does not add a late fee when not overdue", () => {
    const t = withPayments(computeTotals(inv, [item(toMinor(1000, "AED"))]), [], {
      lateFeePercent: 2,
      invoice: futureInvoice,
    });
    expect(t.lateFee).toBe(0);
    expect(t.balance).toBe(105000);
  });
});

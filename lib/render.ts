import type { InvoiceDocumentData } from "@/components/invoice/InvoiceDocument";
import { invoiceLang } from "@/lib/data";
import { effectiveStatus } from "@/lib/status";
import { vatQr } from "@/lib/vat";
import type { InvoiceTotals } from "@/lib/totals";
import type { Invoice, Client, Organization, LineItem, Payment } from "@/generated/prisma/client";

export interface LoadedInvoice {
  org: Organization;
  client: Client;
  items: LineItem[];
  payments: Payment[];
  lang: string;
  number: string | null;
  issueDate: Date;
  dueDate: Date | null;
  currency: string;
  taxName: string | null;
  taxRate: number | null;
  taxInclusive: boolean;
  discountType: string;
  discountValue: number | null;
  notes: string | null;
  notesAr: string | null;
  status: Invoice["status"];
  template: string;
}

export interface LoadedInvoice {
  org: Organization;
  client: Client;
  items: LineItem[];
  payments: Payment[];
  lang: string;
  number: string | null;
  issueDate: Date;
  dueDate: Date | null;
  currency: string;
  taxName: string | null;
  taxRate: number | null;
  taxInclusive: boolean;
  discountType: string;
  discountValue: number | null;
  notes: string | null;
  notesAr: string | null;
  status: Invoice["status"];
  template: string;
  kind: Invoice["kind"];
  expiryDate: Date | null;
}

export function toDocumentData(
  invoice: LoadedInvoice,
  totals: InvoiceTotals
): InvoiceDocumentData {
  const { lang, numerals } = invoiceLang(invoice, invoice.org);
  const template = (invoice.template ?? invoice.org.defaultTemplate ?? "classic") as
    | "classic"
    | "modern"
    | "minimal"
    | "bilingual";

  return {
    template,
    lang,
    kind: invoice.kind === "quote" ? "quote" : "invoice",
    numerals,
    org: {
      name: invoice.org.name,
      nameAr: invoice.org.nameAr,
      address: invoice.org.address,
      addressAr: invoice.org.addressAr,
      vatId: invoice.org.vatId,
      bankDetails: invoice.org.bankDetails,
      logoUrl: invoice.org.logoUrl,
    },
    client: {
      name: invoice.client.name,
      nameAr: invoice.client.nameAr,
      address: invoice.client.address,
      addressAr: invoice.client.addressAr,
      taxId: invoice.client.taxId,
      email: invoice.client.email,
      phone: invoice.client.phone,
    },
    invoice: {
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      expiryDate: invoice.expiryDate,
      currency: invoice.currency,
      taxName: invoice.taxName,
      taxRate: invoice.taxRate,
      taxInclusive: invoice.taxInclusive,
      discountType: invoice.discountType,
      discountValue: invoice.discountValue,
      notes: invoice.notes,
      notesAr: invoice.notesAr,
    },
    lines: totals.lines.map((line, i) => ({
      ...line,
      description: invoice.items[i]?.description ?? "",
      descriptionAr: invoice.items[i]?.descriptionAr,
      taxRate: invoice.items[i]?.taxRate,
    })),
    totals,
    payments: invoice.payments.map((p) => ({
      amount: p.amount,
      method: p.method,
      date: p.date,
      reference: p.reference,
    })),
    status: effectiveStatus(invoice, totals.paid, totals.total),
    showPayments: true,
    hijriDates: invoice.org.hijriDates,
    paymentMethods: (() => {
      try {
        const arr = JSON.parse(invoice.org.paymentMethods ?? "[]");
        return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
      } catch {
        return [];
      }
    })(),
    ...(invoice.org.vatId
      ? (() => {
          const { qr, payload } = vatQr(
            invoice.org.name,
            invoice.org.vatId,
            invoice.currency,
            totals.total,
            totals.taxAmount,
            invoice.issueDate
          );
          return { qr, qrPayload: payload };
        })()
      : { qr: null, qrPayload: null }),
  };
}

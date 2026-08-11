import type {
  InvoiceDocumentData,
  InvoiceLine,
  TemplateId,
} from "@/components/invoice/types";
import { computeTotals } from "@/lib/totals";
import { vatQr } from "@/lib/vat";
import type { Lang, Numerals } from "@/lib/format";

const TEMPLATE_IDS = ["classic", "modern", "minimal", "bilingual"] as const;

export interface PreviewOrg {
  name: string;
  nameAr?: string | null;
  address?: string | null;
  addressAr?: string | null;
  vatId?: string | null;
  bankDetails?: string | null;
  logoUrl?: string | null;
  numerals?: string;
  hijriDates?: boolean;
  paymentMethods?: string;
  themeAccent?: string | null;
}

export interface PreviewClient {
  name: string;
  nameAr?: string | null;
  address?: string | null;
  addressAr?: string | null;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface PreviewLineInput {
  description: string;
  descriptionAr?: string | null;
  quantity: number;
  /** Major units (e.g. 100.50) — converted to minor units internally. */
  unitPrice: number;
  /** Percent; null inherits the invoice-level rate. */
  taxRate?: number | null;
}

export interface DraftDocumentInput {
  kind: "invoice" | "quote";
  lang: "en" | "ar";
  template: string;
  org: PreviewOrg;
  client?: PreviewClient | null;
  currency: string;
  /** yyyy-mm-dd */
  issueDate: string;
  /** yyyy-mm-dd */
  dueDate?: string | null;
  /** yyyy-mm-dd (quotes) */
  expiryDate?: string | null;
  taxName?: string | null;
  taxRate?: number | null;
  taxInclusive?: boolean;
  discountType: string;
  discountValue?: number | null;
  notes?: string | null;
  notesAr?: string | null;
  items: PreviewLineInput[];
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parsePaymentMethods(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Build a full InvoiceDocumentData from live editor state so the on-screen
 * preview renders the exact same component the PDF pipeline uses.
 * Client-safe: only pure helpers (computeTotals, vatQr) are used.
 */
export function toDraftDocument(input: DraftDocumentInput): InvoiceDocumentData {
  const { org, client } = input;
  const lang: Lang = input.lang === "ar" ? "ar" : "en";
  const numerals: Numerals = org.numerals === "eastern" ? "eastern" : "western";
  const template: TemplateId = TEMPLATE_IDS.includes(input.template as TemplateId)
    ? (input.template as TemplateId)
    : "classic";

  const invoice = {
    discountType: input.discountType,
    discountValue: input.discountValue ?? null,
    taxRate: input.taxRate ?? null,
    taxInclusive: Boolean(input.taxInclusive),
  };

  const lines = input.items.map((it) => ({
    quantity: it.quantity,
    unitPrice: Math.round(it.unitPrice * 100),
    taxRate: it.taxRate ?? null,
  }));
  const totals = computeTotals(invoice, lines);

  const docLines: InvoiceLine[] = totals.lines.map((line, i) => ({
    ...line,
    description: input.items[i]?.description ?? "",
    descriptionAr: input.items[i]?.descriptionAr ?? null,
    taxRate: input.items[i]?.taxRate ?? null,
  }));

  const issueDate = toDate(input.issueDate) ?? new Date();
  const qr = org.vatId
    ? vatQr(org.name, org.vatId, input.currency, totals.total, totals.taxAmount, issueDate)
    : null;

  return {
    template,
    lang,
    numerals,
    kind: input.kind,
    org: {
      name: org.name,
      nameAr: org.nameAr ?? null,
      address: org.address ?? null,
      addressAr: org.addressAr ?? null,
      vatId: org.vatId ?? null,
      bankDetails: org.bankDetails ?? null,
      logoUrl: org.logoUrl ?? null,
    },
    client: client
      ? {
          name: client.name,
          nameAr: client.nameAr ?? null,
          address: client.address ?? null,
          addressAr: client.addressAr ?? null,
          taxId: client.taxId ?? null,
          email: client.email ?? null,
          phone: client.phone ?? null,
        }
      : {
          name: "",
          nameAr: null,
          address: null,
          addressAr: null,
          taxId: null,
          email: null,
          phone: null,
        },
    invoice: {
      number: null,
      issueDate,
      dueDate:
        input.kind === "quote"
          ? null
          : toDate(input.dueDate),
      expiryDate: input.kind === "quote" ? toDate(input.expiryDate) : null,
      currency: input.currency,
      taxName: input.taxName ?? null,
      taxRate: input.taxRate ?? null,
      taxInclusive: Boolean(input.taxInclusive),
      discountType: input.discountType,
      discountValue: input.discountValue ?? null,
      notes: input.notes ?? null,
      notesAr: input.notesAr ?? null,
    },
    lines: docLines,
    totals,
    payments: [],
    status: "draft",
    showPayments: false,
    hijriDates: Boolean(org.hijriDates),
    paymentMethods: parsePaymentMethods(org.paymentMethods),
    qr: qr?.qr ?? null,
    qrPayload: qr?.payload ?? null,
  };
}

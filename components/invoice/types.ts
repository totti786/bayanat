import { tr } from "@/lib/i18n";
import type { Lang, Numerals } from "@/lib/format";
import type { InvoiceTotals, LineTotals } from "@/lib/totals";
import type { EffectiveStatus } from "@/lib/status";

export type TemplateId = "classic" | "modern" | "minimal" | "bilingual";

export interface InvoiceLine extends LineTotals {
  description: string;
  descriptionAr?: string | null;
  taxRate?: number | null;
}

export interface DocumentPayment {
  amount: number;
  method: string;
  date: Date | string;
  reference?: string | null;
}

export interface InvoiceDocumentData {
  template: TemplateId;
  lang: Lang;
  numerals: Numerals;
  kind?: "invoice" | "quote";
  org: {
    name: string;
    nameAr?: string | null;
    address?: string | null;
    addressAr?: string | null;
    vatId?: string | null;
    bankDetails?: string | null;
    logoUrl?: string | null;
  };
  client: {
    name: string;
    nameAr?: string | null;
    address?: string | null;
    addressAr?: string | null;
    taxId?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  invoice: {
    number?: string | null;
    issueDate: Date | string;
    dueDate?: Date | string | null;
    expiryDate?: Date | string | null;
    currency: string;
    taxName?: string | null;
    taxRate?: number | null;
    taxInclusive?: boolean;
    discountType: string;
    discountValue?: number | null;
    notes?: string | null;
    notesAr?: string | null;
  };
  lines: InvoiceLine[];
  totals: InvoiceTotals;
  payments: DocumentPayment[];
  status: EffectiveStatus;
  showPayments: boolean;
  hijriDates?: boolean;
  paymentMethods?: string[];
  qr?: string | null;
  qrPayload?: string | null;
}

export function loc(lang: Lang, en?: string | null, ar?: string | null): string {
  if (lang === "ar" && ar) return ar;
  return en ?? "";
}

export const methodLabels: Record<string, { en: string; ar: string }> = {
  cash: { en: "Cash", ar: "نقداً" },
  bank_transfer: { en: "Bank transfer", ar: "تحويل بنكي" },
  card: { en: "Card", ar: "بطاقة" },
  cheque: { en: "Cheque", ar: "شيك" },
  other: { en: "Other", ar: "أخرى" },
};

/** Display label for a stored payment method (legacy codes map to friendly names; custom labels pass through). */
export function methodLabel(method: string, lang: Lang): string {
  return methodLabels[method]?.[lang] ?? method;
}

export const STATUS_BADGE: Record<EffectiveStatus, { en: string; ar: string }> = {
  draft: { en: "DRAFT", ar: "مسودة" },
  sent: { en: "UNPAID", ar: "غير مدفوعة" },
  partially_paid: { en: "PARTIALLY PAID", ar: "مدفوعة جزئياً" },
  paid: { en: "PAID", ar: "مدفوعة" },
  overdue: { en: "OVERDUE", ar: "متأخرة" },
  cancelled: { en: "CANCELLED", ar: "ملغاة" },
};

export { tr };

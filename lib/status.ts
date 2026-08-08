import type { Invoice } from "@/generated/prisma/client";

export type EffectiveStatus =
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export function effectiveStatus(
  invoice: Pick<Invoice, "status" | "dueDate" | "kind">,
  paid: number,
  total: number
): EffectiveStatus {
  if (invoice.status === "draft") return "draft";
  if (invoice.status === "cancelled") return "cancelled";
  if (invoice.status === "paid") return "paid";

  // Quotes and credit notes don't age into overdue or accrue payments.
  if (invoice.kind === "quote" || invoice.kind === "credit_note") return "sent";

  const due = invoice.dueDate ? new Date(invoice.dueDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (paid >= total - 0.005) return "paid";
  if (due && due < today) return "overdue";
  if (paid > 0) return "partially_paid";
  return "sent";
}

export const STATUS_LABELS: Record<EffectiveStatus, { en: string; ar: string }> = {
  draft: { en: "Draft", ar: "مسودة" },
  sent: { en: "Sent", ar: "مرسل" },
  partially_paid: { en: "Partially paid", ar: "مدفوع جزئياً" },
  paid: { en: "Paid", ar: "مدفوع" },
  overdue: { en: "Overdue", ar: "متأخر" },
  cancelled: { en: "Cancelled", ar: "ملغي" },
};

export const STATUS_COLORS: Record<EffectiveStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-50 text-blue-700",
  partially_paid: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  overdue: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

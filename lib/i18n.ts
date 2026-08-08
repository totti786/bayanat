import type { Lang } from "@/lib/format";

type Dict = Record<string, { en: string; ar: string }>;

const dict: Dict = {
  invoice: { en: "INVOICE", ar: "فاتورة" },
  quote: { en: "QUOTE", ar: "عرض سعر" },
  expiryDate: { en: "Valid Until", ar: "صالح حتى" },
  proforma: { en: "PROFORMA", ar: "فاتورة أولية" },
  billTo: { en: "Bill To", ar: "فاتورة إلى" },
  from: { en: "From", ar: "من" },
  issuedOn: { en: "Issue Date", ar: "تاريخ الإصدار" },
  dueDate: { en: "Due Date", ar: "تاريخ الاستحقاق" },
  invoiceNumber: { en: "Invoice No.", ar: "رقم الفاتورة" },
  description: { en: "Description", ar: "الوصف" },
  quantity: { en: "Qty", ar: "الكمية" },
  unitPrice: { en: "Unit Price", ar: "سعر الوحدة" },
  tax: { en: "Tax", ar: "الضريبة" },
  amount: { en: "Amount", ar: "المبلغ" },
  subtotal: { en: "Subtotal", ar: "المجموع الفرعي" },
  discount: { en: "Discount", ar: "الخصم" },
  total: { en: "Total", ar: "الإجمالي" },
  paid: { en: "Paid", ar: "المدفوع" },
  balanceDue: { en: "Balance Due", ar: "المبلغ المتبقي" },
  amountDue: { en: "Amount Due", ar: "المبلغ المستحق" },
  payments: { en: "Payments", ar: "المدفوعات" },
  paymentDate: { en: "Date", ar: "التاريخ" },
  paymentMethod: { en: "Method", ar: "الطريقة" },
  reference: { en: "Reference", ar: "المرجع" },
  paymentNotes: { en: "Payments received", ar: "المدفوعات المستلمة" },
  taxId: { en: "Tax ID", ar: "الرقم الضريبي" },
  taxIncluded: { en: "Tax included in prices", ar: "الضريبة مضمنة في الأسعار" },
  notes: { en: "Notes", ar: "ملاحظات" },
  thankYou: { en: "Thank you for your business.", ar: "شكراً لتعاملكم معنا" },
  page: { en: "Page", ar: "صفحة" },
  of: { en: "of", ar: "من" },
  paidInFull: { en: "PAID", ar: "مدفوعة" },
  unpaid: { en: "UNPAID", ar: "غير مدفوعة" },
  partiallyPaid: { en: "PARTIALLY PAID", ar: "مدفوعة جزئياً" },
  overdue: { en: "OVERDUE", ar: "متأخرة" },
  draft: { en: "DRAFT", ar: "مسودة" },
  invoiceCurrency: { en: "Invoice Currency", ar: "عملة الفاتورة" },
  vatQr: { en: "VAT QR Code", ar: "رمز الاستجابة السريعة للضريبة" },
  paymentMethods: { en: "Payment methods", ar: "طرق الدفع" },
  lateFee: { en: "Late fee", ar: "رسوم تأخير" },
};

export function tr(key: string, lang: Lang): string {
  const entry = dict[key];
  if (!entry) return key;
  return entry[lang];
}

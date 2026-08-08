import type { InvoiceDocumentData } from "@/components/invoice/types";
import ClassicTemplate from "@/components/invoice/templates/ClassicTemplate";
import ModernTemplate from "@/components/invoice/templates/ModernTemplate";
import MinimalTemplate from "@/components/invoice/templates/MinimalTemplate";
import BilingualTemplate from "@/components/invoice/templates/BilingualTemplate";

export type { InvoiceDocumentData, InvoiceLine, DocumentPayment, TemplateId } from "@/components/invoice/types";

const TEMPLATES = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  bilingual: BilingualTemplate,
} as const;

export default function InvoiceDocument(data: InvoiceDocumentData) {
  const Template = TEMPLATES[data.template] ?? ClassicTemplate;
  const { lang } = data;
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div
      dir={dir}
      className="w-[210mm] min-h-[297mm] bg-white text-neutral-800"
      style={{ fontFamily: lang === "ar" ? "var(--font-cairo)" : "var(--font-inter)" }}
    >
      <Template {...data} />
    </div>
  );
}

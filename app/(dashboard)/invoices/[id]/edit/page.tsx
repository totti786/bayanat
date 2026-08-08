import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { Card } from "@/components/ui";
import InvoiceForm from "@/components/InvoiceForm";
import { getUiLang } from "@/lib/ui-lang";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { org } = await requireOrg();
  const lang = await getUiLang();

  const invoice = await prisma.invoice.findFirst({
    where: { id, orgId: org.id },
    include: { items: true },
  });
  if (!invoice) notFound();
  if (invoice.status !== "draft") redirect(`/invoices/${id}`);

  const clients = await prisma.client.findMany({
    where: { orgId: org.id },
    orderBy: { name: "asc" },
  });
  const products = await prisma.product.findMany({
    where: { orgId: org.id, active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{lang === "ar" ? "تعديل الفاتورة" : "Edit invoice"}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Edits are locked once the invoice is sent — sending is irreversible
        </p>
      </div>
      <Card className="p-6">
        <InvoiceForm
          clients={clients}
          uiLang={lang}
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            nameAr: p.nameAr,
            unitPrice: p.unitPrice / 100,
            taxRate: p.taxRate,
          }))}
          org={{
            defaultCurrency: org.defaultCurrency,
            defaultTaxName: org.defaultTaxName,
            defaultTaxRate: org.defaultTaxRate,
            taxInclusive: org.taxInclusive,
            defaultTemplate: org.defaultTemplate,
          }}
          invoice={{
            id: invoice.id,
            clientId: invoice.clientId,
            lang: invoice.lang,
            kind: invoice.kind,
            currency: invoice.currency,
            issueDate: invoice.issueDate.toISOString().slice(0, 10),
            dueDate: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : null,
            expiryDate: invoice.expiryDate ? invoice.expiryDate.toISOString().slice(0, 10) : null,
            discountType: invoice.discountType,
            discountValue: invoice.discountValue,
            taxName: invoice.taxName,
            taxRate: invoice.taxRate,
            taxInclusive: invoice.taxInclusive,
            template: invoice.template,
            notes: invoice.notes,
            notesAr: invoice.notesAr,
            items: invoice.items.map((it) => ({
              description: it.description,
              descriptionAr: it.descriptionAr,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              taxRate: it.taxRate,
            })),
          }}
        />
      </Card>
    </div>
  );
}

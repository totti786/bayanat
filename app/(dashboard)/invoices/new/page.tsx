import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import InvoiceForm from "@/components/InvoiceForm";
import { getUiLang } from "@/lib/ui-lang";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { org } = await requireOrg();
  const { clientId } = await searchParams;
  const lang = await getUiLang();

  const clients = await prisma.client.findMany({
    where: { orgId: org.id },
    orderBy: { name: "asc" },
  });
  const products = await prisma.product.findMany({
    where: { orgId: org.id, active: true },
    orderBy: { name: "asc" },
  });

  if (clients.length === 0) redirect("/clients/new");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{lang === "ar" ? "فاتورة جديدة" : "New invoice"}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {lang === "ar" ? "لا تُرقَّم المسودات إلا عند الإرسال — ولا تُكرَّر الأرقام أبداً" : "Drafts get a number only when you send them — numbers are never reused"}
        </p>
      </div>
      <InvoiceForm
        key={clientId ?? "new"}
        clients={clients.map((c) => ({
          id: c.id,
          name: c.name,
          nameAr: c.nameAr,
          address: c.address,
          addressAr: c.addressAr,
          taxId: c.taxId,
          email: c.email,
          phone: c.phone,
          currency: c.currency,
          language: c.language,
          paymentTerms: c.paymentTerms,
        }))}
        defaultClientId={clientId}
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
          name: org.name,
          nameAr: org.nameAr,
          address: org.address,
          addressAr: org.addressAr,
          vatId: org.vatId,
          bankDetails: org.bankDetails,
          logoUrl: org.logoUrl,
          numerals: org.numerals,
          hijriDates: org.hijriDates,
          paymentMethods: org.paymentMethods,
          themeAccent: org.themeAccent,
        }}
      />
    </div>
  );
}

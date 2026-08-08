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

  if (clients.length === 0) redirect("/clients/new");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{lang === "ar" ? "فاتورة جديدة" : "New invoice"}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {lang === "ar" ? "لا تُرقَّم المسودات إلا عند الإرسال — ولا تُكرَّر الأرقام أبداً" : "Drafts get a number only when you send them — numbers are never reused"}
        </p>
      </div>
      <InvoiceForm
        key={clientId ?? "new"}
        clients={clients}
        defaultClientId={clientId}
        uiLang={lang}
        org={{
          defaultCurrency: org.defaultCurrency,
          defaultTaxName: org.defaultTaxName,
          defaultTaxRate: org.defaultTaxRate,
          taxInclusive: org.taxInclusive,
          defaultTemplate: org.defaultTemplate,
        }}
      />
    </div>
  );
}

import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { getUiLang } from "@/lib/ui-lang";
import CatalogPanel from "@/components/CatalogPanel";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const { org } = await requireOrg();
  const lang = await getUiLang();

  const products = await prisma.product.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          {lang === "ar" ? "المنتجات والخدمات" : "Products & services"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {lang === "ar"
            ? "احفظ عناصرك القابلة لإعادة الاستخدام لإضافتها بسرعة إلى الفواتير"
            : "Save reusable line items and add them to invoices in one click"}
        </p>
      </div>
      <CatalogPanel
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          nameAr: p.nameAr,
          unitPrice: p.unitPrice,
          taxRate: p.taxRate,
        }))}
        currency={org.defaultCurrency}
        lang={lang}
      />
    </div>
  );
}

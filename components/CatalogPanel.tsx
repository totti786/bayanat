"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, deleteProduct } from "@/lib/actions/products";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/components/Toast";
import { Button, Input, Field, ErrorBanner, SuccessBanner } from "@/components/ui";
import { fromMinor } from "@/lib/money";
import { u, type UiLang } from "@/lib/ui";

export default function CatalogPanel({
  products,
  currency,
  lang,
}: {
  products: { id: string; name: string; nameAr: string | null; unitPrice: number; taxRate: number | null }[];
  currency: string;
  lang: UiLang;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [state, formAction, pending] = useActionState(createProduct, null);
  const [taxEnabled, setTaxEnabled] = useState(false);

  async function remove(id: string, name: string) {
    const ok = await confirm({
      title: u("delete", lang) + " " + name + "?",
      confirmLabel: u("delete", lang),
    });
    if (!ok) return;
    try {
      await deleteProduct(id);
      toast({ title: u("delete", lang) });
      router.refresh();
    } catch (e) {
      toast({ title: "Error", variant: "error", description: e instanceof Error ? e.message : undefined });
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">
          {lang === "ar" ? "إضافة منتج" : "Add a product"}
        </h2>
        <ErrorBanner message={state?.error} />
        <SuccessBanner message={state?.success ? (lang === "ar" ? "تمت الإضافة" : "Added") : undefined} />
        <form action={formAction} className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={u("nameEn", lang)}>
            <Input name="name" required placeholder="Website design" />
          </Field>
          <Field label={u("nameAr", lang)}>
            <Input name="nameAr" dir="rtl" placeholder="تصميم موقع" />
          </Field>
          <Field label={`${u("unitPrice", lang)} (${currency})`}>
            <Input name="unitPrice" type="number" min="0" step="0.01" required placeholder="0.00" />
          </Field>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              {taxEnabled ? (
                <Field label={u("taxRate", lang)}>
                  <Input name="taxRate" type="number" min="0" max="100" step="0.01" placeholder="15" />
                </Field>
              ) : (
                <Field label={u("taxRate", lang)}>
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-400">
                    {lang === "ar" ? "بدون ضريبة" : "No tax"}
                  </div>
                </Field>
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setTaxEnabled((v) => !v)}
              className="mb-0.5"
            >
              {taxEnabled ? (lang === "ar" ? "إزالة" : "Remove") : (lang === "ar" ? "إضافة ضريبة" : "Add tax")}
            </Button>
          </div>
          <div className="sm:col-span-2">
            <Field label={u("description", lang)}>
              <Input name="description" placeholder="Optional" />
            </Field>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? u("saving", lang) : u("add", lang)}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-neutral-900">{lang === "ar" ? "المنتجات" : "Products"}</h2>
        </div>
        {products.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-neutral-500">
            {lang === "ar" ? "لا توجد منتجات بعد" : "No products yet"}
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-3.5">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{p.name}</p>
                  {p.nameAr && <p className="text-xs text-neutral-400" dir="rtl">{p.nameAr}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-neutral-900">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
                      fromMinor(p.unitPrice, currency)
                    )}
                    {p.taxRate != null ? ` · ${p.taxRate}%` : ""}
                  </span>
                  <button
                    onClick={() => remove(p.id, p.name)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    {u("delete", lang)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

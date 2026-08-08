"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { switchOrg, createCompany } from "@/lib/actions/org";
import { Button, Input, ErrorBanner, SuccessBanner } from "@/components/ui";
import { u, type UiLang } from "@/lib/ui";

export default function CompaniesPanel({
  companies,
  activeId,
  lang,
}: {
  companies: { id: string; name: string; role: string }[];
  activeId: string;
  lang: UiLang;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createCompany, null);

  async function go(id: string) {
    await switchOrg(id);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="mb-1 text-sm font-semibold text-neutral-900">
        {lang === "ar" ? "الشركات" : "Companies"}
      </h2>
      <p className="mb-4 text-xs text-neutral-500">
        {lang === "ar" ? "بدّل بين الشركات أو أنشئ شركة جديدة" : "Switch between companies or create a new one"}
      </p>

      <div className="space-y-2">
        {companies.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-2.5">
            <div>
              <p className="text-sm font-medium text-neutral-900">{c.name}</p>
              <p className="text-xs text-neutral-400">
                {c.role === "admin" ? u("admin", lang) : c.role === "accountant" ? u("accountant", lang) : u("viewer", lang)}
              </p>
            </div>
            {c.id === activeId ? (
              <span className="text-xs font-medium text-brand-700">
                {lang === "ar" ? "حالية" : "Active"}
              </span>
            ) : (
              <button onClick={() => go(c.id)} className="text-xs font-medium text-neutral-600 hover:underline">
                {lang === "ar" ? "تبديل" : "Switch"}
              </button>
            )}
          </div>
        ))}
      </div>

      <form action={formAction} className="mt-4 flex items-center gap-2">
        <ErrorBanner message={state?.error} />
        <SuccessBanner message={state?.success ? (lang === "ar" ? "تم الإنشاء" : "Created") : undefined} />
        <Input name="name" placeholder={lang === "ar" ? "اسم الشركة الجديدة" : "New company name"} className="max-w-xs" />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? u("loading", lang) : u("add", lang)}
        </Button>
      </form>
    </div>
  );
}

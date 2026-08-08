import { Card } from "@/components/ui";
import ClientForm from "@/components/ClientForm";
import { getUiLang } from "@/lib/ui-lang";
import { u } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function NewClientPage() {
  const lang = await getUiLang();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{u("newClient", lang)}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {lang === "ar"
            ? "أضف التفاصيل بلغتين — ستُستخدم اللغة التي تختارها في الفاتورة"
            : "Add bilingual details — the invoice will use whichever language you pick"}
        </p>
      </div>
      <Card className="p-6">
        <ClientForm lang={lang} />
      </Card>
    </div>
  );
}

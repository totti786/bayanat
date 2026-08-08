"use client";

import { useRouter } from "next/navigation";
import { setUiLang } from "@/lib/actions/ui";
import type { UiLang } from "@/lib/ui";

export default function LangToggle({ lang }: { lang: UiLang }) {
  const router = useRouter();
  const next: UiLang = lang === "ar" ? "en" : "ar";

  return (
    <button
      onClick={async () => {
        await setUiLang(next);
        router.refresh();
      }}
      className="rounded-md px-2.5 py-1.5 text-sm font-medium text-neutral-600 hover:bg-white hover:text-neutral-900"
      title={lang === "ar" ? "English" : "العربية"}
    >
      {lang === "ar" ? "EN" : "ع"}
    </button>
  );
}

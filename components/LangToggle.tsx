"use client";

import { useRouter } from "next/navigation";
import { setUiLang } from "@/lib/actions/ui";
import type { UiLang } from "@/lib/ui";

export default function LangToggle({ lang }: { lang: UiLang }) {
  const router = useRouter();

  function switchTo(next: UiLang) {
    return async () => {
      if (next === lang) return;
      await setUiLang(next);
      router.refresh();
    };
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center rounded-md border border-neutral-200 bg-neutral-100/80 p-0.5"
    >
      <button
        type="button"
        onClick={switchTo("en")}
        aria-pressed={lang === "en"}
        title="English"
        className={`rounded-[5px] px-2 py-0.5 text-xs font-semibold transition-colors ${
          lang === "en"
            ? "bg-white text-neutral-900 shadow-sm"
            : "text-neutral-500 hover:text-neutral-800"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={switchTo("ar")}
        aria-pressed={lang === "ar"}
        title="العربية"
        className={`rounded-[5px] px-2 py-0.5 text-xs font-semibold transition-colors ${
          lang === "ar"
            ? "bg-white text-neutral-900 shadow-sm"
            : "text-neutral-500 hover:text-neutral-800"
        }`}
      >
        ع
      </button>
    </div>
  );
}

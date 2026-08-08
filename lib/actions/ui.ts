"use server";

import { cookies } from "next/headers";
import { UI_LANG_COOKIE } from "@/lib/ui";

export async function setUiLang(lang: "en" | "ar"): Promise<void> {
  const store = await cookies();
  store.set(UI_LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
  });
}

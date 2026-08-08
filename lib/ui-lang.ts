import "server-only";

import { cookies } from "next/headers";
import type { UiLang } from "@/lib/ui";
import { UI_LANG_COOKIE } from "@/lib/ui";

export async function getUiLang(): Promise<UiLang> {
  const store = await cookies();
  return store.get(UI_LANG_COOKIE)?.value === "ar" ? "ar" : "en";
}

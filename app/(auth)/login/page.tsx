import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUiLang } from "@/lib/ui-lang";
import { u } from "@/lib/ui";
import { Card } from "@/components/ui";
import { LogoMark, Wordmark } from "@/components/Logo";
import LoginForm from "@/components/LoginForm";
import LangToggle from "@/components/LangToggle";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  const lang = await getUiLang();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-4">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-gold-300/30 blur-3xl" />
      <div className="absolute top-4 end-4">
        <LangToggle lang={lang} />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark size={48} />
          <div className="mt-4">
            <Wordmark dark />
          </div>
          <p className="mt-2 text-sm text-neutral-500">{u("signInTo", lang)}</p>
        </div>
        <Card className="p-6">
          <LoginForm lang={lang} />
        </Card>
      </div>
    </div>
  );
}

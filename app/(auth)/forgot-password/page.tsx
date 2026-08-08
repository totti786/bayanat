import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUiLang } from "@/lib/ui-lang";
import { Card } from "@/components/ui";
import { LogoMark, Wordmark } from "@/components/Logo";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import LangToggle from "@/components/LangToggle";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  const lang = await getUiLang();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="absolute top-4 end-4">
        <LangToggle lang={lang} />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark size={44} />
          <div className="mt-3">
            <Wordmark dark />
          </div>
          <h1 className="mt-4 text-xl font-bold text-neutral-900">
            {lang === "ar" ? "استعادة كلمة المرور" : "Reset your password"}
          </h1>
        </div>
        <Card className="p-6">
          <ForgotPasswordForm lang={lang} />
        </Card>
      </div>
    </div>
  );
}

import { Card } from "@/components/ui";
import { LogoMark, Wordmark } from "@/components/Logo";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { getUiLang } from "@/lib/ui-lang";
import LangToggle from "@/components/LangToggle";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
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
            {lang === "ar" ? "اختر كلمة مرور جديدة" : "Choose a new password"}
          </h1>
        </div>
        <Card className="p-6">
          {token ? (
            <ResetPasswordForm token={token} lang={lang} />
          ) : (
            <p className="text-sm text-neutral-500">
              {lang === "ar"
                ? "رابط إعادة التعيين غير صالح. اطلب رابطاً جديداً."
                : "This reset link is invalid. Request a new one."}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

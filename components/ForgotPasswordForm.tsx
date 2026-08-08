"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/reset";
import { u, type UiLang } from "@/lib/ui";
import { Button, Input, Label, ErrorBanner, SuccessBanner } from "@/components/ui";

export default function ForgotPasswordForm({ lang }: { lang: UiLang }) {
  const [state, formAction, pending] = useActionState(requestPasswordReset, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.success && (
        <SuccessBanner
          message={
            lang === "ar"
              ? "إذا كان البريد مسجلاً، ستصل رسالة إعادة تعيين كلمة المرور."
              : "If that email is registered, a reset link is on its way."
          }
        />
      )}
      {state?.success && state.resetUrl && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-xs text-brand-800">
          <p>Email not configured — use this reset link (expires in 1 hour):</p>
          <p className="mt-1 break-all font-mono">{state.resetUrl}</p>
        </div>
      )}
      <ErrorBanner message={state?.error} />
      <div>
        <Label htmlFor="email">{u("email", lang)}</Label>
        <Input id="email" name="email" type="email" placeholder="you@company.com" required autoFocus />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? u("loading", lang) : lang === "ar" ? "إرسال رابط إعادة التعيين" : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-neutral-500">
        <Link href="/login" className="font-medium text-neutral-900 hover:underline">
          {u("signIn", lang)}
        </Link>
      </p>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { resetPassword } from "@/lib/actions/reset";
import { u, type UiLang } from "@/lib/ui";
import { Button, Input, Label, ErrorBanner } from "@/components/ui";

export default function ResetPasswordForm({ token, lang }: { token: string; lang: UiLang }) {
  const [state, formAction, pending] = useActionState(resetPassword.bind(null, token), null);

  return (
    <form action={formAction} className="space-y-4">
      <ErrorBanner message={state?.error} />
      <div>
        <Label htmlFor="password">{u("newPassword", lang)}</Label>
        <Input id="password" name="password" type="password" placeholder="At least 8 characters" required minLength={8} autoFocus />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? u("loading", lang) : lang === "ar" ? "تحديث كلمة المرور" : "Update password"}
      </Button>
    </form>
  );
}

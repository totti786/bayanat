"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";
import { u, type UiLang } from "@/lib/ui";
import { Button, Input, Label, ErrorBanner } from "@/components/ui";

export default function LoginForm({ lang }: { lang: UiLang }) {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <form action={formAction} className="space-y-4">
      <ErrorBanner message={state?.error} />
      <div>
        <Label htmlFor="email">{u("email", lang)}</Label>
        <Input id="email" name="email" type="email" placeholder="you@company.com" required autoFocus />
      </div>
      <div>
        <Label htmlFor="password">{u("password", lang)}</Label>
        <div className="flex items-center justify-between gap-2">
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
          <Link
            href="/forgot-password"
            className="shrink-0 text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:underline"
          >
            {lang === "ar" ? "نسيت كلمة المرور؟" : "Forgot?"}
          </Link>
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? u("signingIn", lang) : u("signIn", lang)}
      </Button>
      <p className="text-center text-sm text-neutral-500">
        {u("noAccount", lang)}{" "}
        <Link href="/signup" className="font-medium text-neutral-900 hover:underline">
          {u("createOne", lang)}
        </Link>
      </p>
    </form>
  );
}

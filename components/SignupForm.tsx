"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/lib/actions/auth";
import { u, type UiLang } from "@/lib/ui";
import { Button, Input, Label, ErrorBanner } from "@/components/ui";

export default function SignupForm({ lang }: { lang: UiLang }) {
  const [state, formAction, pending] = useActionState(signup, null);

  return (
    <form action={formAction} className="space-y-4">
      <ErrorBanner message={state?.error} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="orgName">{u("company", lang)}</Label>
          <Input id="orgName" name="orgName" placeholder="Acme LLC" required autoFocus />
        </div>
        <div>
          <Label htmlFor="name">{u("yourName", lang)}</Label>
          <Input id="name" name="name" placeholder="Tarek" required />
        </div>
      </div>
      <div>
        <Label htmlFor="email">{u("workEmail", lang)}</Label>
        <Input id="email" name="email" type="email" placeholder="you@company.com" required />
      </div>
      <div>
        <Label htmlFor="password">{u("password", lang)}</Label>
        <Input id="password" name="password" type="password" placeholder={u("newPassword", lang)} required minLength={8} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? u("creating", lang) : u("createAccount", lang)}
      </Button>
      <p className="text-center text-sm text-neutral-500">
        {u("haveAccount", lang)}{" "}
        <Link href="/login" className="font-medium text-neutral-900 hover:underline">
          {u("signIn", lang)}
        </Link>
      </p>
    </form>
  );
}

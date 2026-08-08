"use client";

import { useActionState } from "react";
import { acceptInvite } from "@/lib/actions/team";
import { Button, Input, Label, ErrorBanner } from "@/components/ui";

export default function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(acceptInvite.bind(null, token), null);

  return (
    <form action={formAction} className="space-y-4">
      <ErrorBanner message={state?.error} />
      <div>
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" placeholder="Full name" required autoFocus />
      </div>
      <div>
        <Label htmlFor="password">Choose a password</Label>
        <Input id="password" name="password" type="password" placeholder="At least 8 characters" required minLength={8} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Accept invitation"}
      </Button>
    </form>
  );
}

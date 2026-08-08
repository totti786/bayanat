"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  inviteMember,
  updateMemberRole,
  removeMember,
  changePassword,
} from "@/lib/actions/team";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/components/Toast";
import { Button, Input, Select, Field, ErrorBanner, SuccessBanner } from "@/components/ui";
import { u, type UiLang } from "@/lib/ui";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function TeamPanel({
  members,
  pendingInvites,
  currentUserId,
  isAdmin,
  lang,
}: {
  members: Member[];
  pendingInvites: { id: string; email: string; role: string; expiresAt: Date }[];
  currentUserId: string;
  isAdmin: boolean;
  lang: UiLang;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [inviteState, inviteAction, invitePending] = useActionState(inviteMember, null);
  const [pwState, pwAction, pwPending] = useActionState(changePassword, null);

  async function copyInvite(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Invite link copied" });
    } catch {
      /* clipboard may be unavailable */
    }
  }

  async function changeRole(memberId: string, role: string) {
    try {
      await updateMemberRole(memberId, role as "admin" | "accountant" | "viewer");
      toast({ title: u("role", lang) });
      router.refresh();
    } catch (e) {
      toast({
        title: "Could not update role",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    }
  }

  async function remove(memberId: string, name: string) {
    const ok = await confirm({
      title: `Remove ${name}?`,
      description: "They will lose access to this workspace.",
      confirmLabel: "Remove",
    });
    if (!ok) return;
    try {
      await removeMember(memberId);
      toast({ title: u("remove", lang) });
      router.refresh();
    } catch (e) {
      toast({
        title: "Could not remove member",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    }
  }

  const roleLabel = (r: string) =>
    r === "admin" ? "Admin" : r === "accountant" ? "Accountant" : "Viewer";

  return (
    <div className="space-y-6">
      {inviteState?.inviteUrl && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-medium text-brand-900">{u("inviteLink", lang)}</p>
          <p className="mt-1 break-all text-xs text-brand-800">{inviteState.inviteUrl}</p>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" onClick={() => copyInvite(inviteState.inviteUrl!)}>
              Copy
            </Button>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">{u("inviteMember", lang)}</h2>
          <ErrorBanner message={inviteState?.error} />
          <SuccessBanner message={inviteState?.success ? "Invitation created" : undefined} />
          <form action={inviteAction} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label={u("email", lang)}>
                <Input name="email" type="email" placeholder="teammate@company.com" required />
              </Field>
            </div>
            <div className="w-40">
              <Field label={u("role", lang)}>
                <Select name="role" defaultValue="accountant">
                  <option value="accountant">{u("accountant", lang)}</option>
                  <option value="viewer">{u("viewer", lang)}</option>
                  <option value="admin">{u("admin", lang)}</option>
                </Select>
              </Field>
            </div>
            <Button type="submit" disabled={invitePending}>
              {invitePending ? u("sending", lang) : u("sendInvite", lang)}
            </Button>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-neutral-900">{u("members", lang)}</h2>
        </div>
        <div className="divide-y divide-neutral-100">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-6 py-3.5">
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {m.name}
                  {m.id === currentUserId && (
                    <span className="ml-2 text-xs text-neutral-400">{u("you", lang)}</span>
                  )}
                </p>
                <p className="text-xs text-neutral-500">{m.email}</p>
              </div>
              <div className="flex items-center gap-3">
                {isAdmin && m.id !== currentUserId ? (
                  <Select
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value)}
                    className="w-36 py-1.5"
                  >
                    <option value="admin">{u("admin", lang)}</option>
                    <option value="accountant">{u("accountant", lang)}</option>
                    <option value="viewer">{u("viewer", lang)}</option>
                  </Select>
                ) : (
                  <span className="text-sm text-neutral-500">{roleLabel(m.role)}</span>
                )}
                {isAdmin && m.id !== currentUserId && (
                  <button
                    onClick={() => remove(m.id, m.name)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {pendingInvites.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-neutral-900">{u("pendingInvites", lang)}</h2>
          </div>
          <div className="divide-y divide-neutral-100">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-6 py-3.5">
                <p className="text-sm text-neutral-700">{inv.email}</p>
                <span className="text-xs text-neutral-400">
                  {roleLabel(inv.role)} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">{u("changePassword", lang)}</h2>
        <ErrorBanner message={pwState?.error} />
        <SuccessBanner message={pwState?.success ? "Password updated" : undefined} />
        <form action={pwAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input name="currentPassword" type="password" placeholder={u("currentPassword", lang)} required />
          <Input name="newPassword" type="password" placeholder={u("newPassword", lang)} required minLength={8} />
          <Button type="submit" disabled={pwPending}>
            {pwPending ? u("saving", lang) : u("changePassword", lang)}
          </Button>
        </form>
      </div>
    </div>
  );
}

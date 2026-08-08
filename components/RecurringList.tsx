"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleRecurring, deleteRecurring } from "@/lib/actions/recurring";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/components/Toast";
import { u, type UiLang } from "@/lib/ui";

export default function RecurringList({
  ruleId,
  active,
  lang,
}: {
  ruleId: string;
  active: boolean;
  lang: UiLang;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle() {
    setBusy("toggle");
    try {
      await toggleRecurring(ruleId);
      toast({ title: active ? "Schedule paused" : "Schedule resumed" });
      router.refresh();
    } catch (e) {
      toast({ title: "Could not update", variant: "error", description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    const ok = await confirm({
      title: "Delete this schedule?",
      description: "No future invoices will be generated.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    setBusy("delete");
    try {
      await deleteRecurring(ruleId);
      toast({ title: "Schedule deleted" });
      router.refresh();
    } catch (e) {
      toast({ title: "Could not delete", variant: "error", description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={busy === "toggle"}
        className="text-xs font-medium text-neutral-600 hover:underline disabled:opacity-50"
      >
        {active ? u("paused", lang) : u("active", lang)}
      </button>
      <button
        onClick={remove}
        disabled={busy === "delete"}
        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}

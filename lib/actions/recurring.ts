"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";

export type RecurringState = { error?: string; success?: boolean } | null;

export async function createRecurringFromInvoice(
  invoiceId: string,
  _prev: RecurringState,
  formData: FormData
): Promise<RecurringState> {
  const { org } = await requireOrg();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId: org.id },
    include: { items: true },
  });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.kind === "quote") return { error: "Quotes cannot be repeated" };

  const frequency = formData.get("frequency") as "weekly" | "monthly" | "quarterly" | "yearly";
  const interval = Math.max(1, Number(formData.get("interval")) || 1);
  const dayOfMonthRaw = formData.get("dayOfMonth");
  const dayOfMonth = dayOfMonthRaw && dayOfMonthRaw !== "" ? Number(dayOfMonthRaw) : null;
  const start = formData.get("startDate") ? new Date(String(formData.get("startDate"))) : new Date();

  const itemsJson = JSON.stringify(
    invoice.items.map((it) => ({
      description: it.description,
      descriptionAr: it.descriptionAr,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      taxRate: it.taxRate,
    }))
  );

  await prisma.recurringRule.create({
    data: {
      orgId: org.id,
      clientId: invoice.clientId,
      frequency,
      interval,
      dayOfMonth,
      lang: invoice.lang,
      currency: invoice.currency,
      template: invoice.template,
      taxName: invoice.taxName,
      taxRate: invoice.taxRate,
      taxInclusive: invoice.taxInclusive,
      discountType: invoice.discountType,
      discountValue: invoice.discountValue,
      notes: invoice.notes,
      notesAr: invoice.notesAr,
      itemsJson,
      nextRun: start,
    },
  });

  revalidatePath("/recurring");
  return { success: true };
}

export async function toggleRecurring(ruleId: string): Promise<void> {
  const { org } = await requireOrg();
  const rule = await prisma.recurringRule.findFirst({
    where: { id: ruleId, orgId: org.id },
  });
  if (!rule) throw new Error("Recurring rule not found");

  await prisma.recurringRule.update({
    where: { id: ruleId },
    data: { active: !rule.active },
  });
  revalidatePath("/recurring");
}

export async function deleteRecurring(ruleId: string): Promise<void> {
  const { org } = await requireOrg();
  await prisma.recurringRule.deleteMany({ where: { id: ruleId, orgId: org.id } });
  revalidatePath("/recurring");
}

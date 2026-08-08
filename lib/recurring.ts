import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import type { RecurrenceFrequency } from "@/generated/prisma/client";

export function nextRunDate(
  frequency: RecurrenceFrequency,
  interval: number,
  dayOfMonth: number | null,
  from: Date
): Date {
  const d = new Date(from);

  if (frequency === "weekly") {
    d.setDate(d.getDate() + interval * 7);
  } else {
    let months = interval;
    if (frequency === "quarterly") months = interval * 3;
    if (frequency === "yearly") months = interval * 12;

    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + months);

    if (dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31) {
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(dayOfMonth, last));
    } else {
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(day, last));
    }
  }

  return d;
}

export interface RecurringItem {
  description: string;
  descriptionAr?: string | null;
  quantity: number;
  unitPrice: number; // minor units
  taxRate?: number | null;
}

export function parseItems(json: string): RecurringItem[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Generate invoices for every due recurring rule. Safe to call repeatedly —
 * each rule is guarded by nextRun inside a transaction.
 */
export async function generateDueInvoices(now = new Date()): Promise<number> {
  const rules = await prisma.recurringRule.findMany({
    where: { active: true, nextRun: { lte: now } },
    include: { client: true },
  });

  let generated = 0;
  for (const rule of rules) {
    await prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUnique({ where: { id: rule.orgId } });
      if (!org) return;

      const seq = org.nextNumber;
      const number = `${org.prefix}-${String(seq).padStart(4, "0")}`;
      await tx.organization.update({
        where: { id: rule.orgId },
        data: { nextNumber: seq + 1 },
      });

      const items = parseItems(rule.itemsJson);
      const due = new Date(now);
      due.setDate(due.getDate() + rule.client.paymentTerms);

      const created = await tx.invoice.create({
        data: {
          orgId: rule.orgId,
          clientId: rule.clientId,
          number,
          seq,
          lang: rule.lang,
          currency: rule.currency,
          issueDate: now,
          dueDate: due,
          status: "sent",
          kind: "invoice",
          template: rule.template,
          taxName: rule.taxName,
          taxRate: rule.taxRate,
          taxInclusive: rule.taxInclusive,
          discountType: rule.discountType,
          discountValue: rule.discountValue,
          notes: rule.notes,
          notesAr: rule.notesAr,
          items: {
            create: items.map((it) => ({
              description: it.description,
              descriptionAr: it.descriptionAr ?? null,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              taxRate: it.taxRate ?? null,
            })),
          },
        },
      });

      await tx.recurringRule.update({
        where: { id: rule.id },
        data: {
          lastRunAt: now,
          nextRun: nextRunDate(rule.frequency, rule.interval, rule.dayOfMonth, now),
        },
      });

      await notify(rule.orgId, {
        type: "recurring_generated",
        title: `Recurring invoice ${number} generated`,
        titleAr: `تم إنشاء الفاتورة المتكررة ${number}`,
        invoiceId: created.id,
      });
    });
    generated += 1;
  }

  return generated;
}

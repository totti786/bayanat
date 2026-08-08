"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { invoiceSchema, paymentSchema } from "@/lib/validators";
import { computeTotals, withPayments, paidAmount } from "@/lib/totals";
import { toMinor } from "@/lib/money";
import { createShareToken } from "@/lib/share";
import { renderPdf, appUrl } from "@/lib/pdf";
import { emailConfigured, sendMail } from "@/lib/mail";
import { tr } from "@/lib/i18n";

export type ShareResult = { shareUrl: string; emailed: boolean };

export async function sendInvoiceEmail(invoiceId: string): Promise<ShareResult> {
  const { org } = await requireOrg();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId: org.id },
    include: { client: true },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "draft") {
    throw new Error("Send the invoice first so it has a number");
  }

  const token = await createShareToken(invoice.id);
  const shareUrl = `${appUrl("")}/share/${token}`;
  const lang = invoice.lang === "ar" ? "ar" : "en";

  let emailed = false;
  if (emailConfigured() && invoice.client.email) {
    try {
      const pdf = await renderPdf({
        url: `${appUrl("")}/share/${token}?format=pdf`,
      });
      await sendMail({
        to: invoice.client.email,
        subject:
          lang === "ar"
            ? `فاتورة ${invoice.number ?? ""} من ${org.name}`
            : `Invoice ${invoice.number ?? ""} from ${org.name}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
            <p style="font-size:16px;color:#111">${lang === "ar" ? "مرحباً" : "Hello"} ${invoice.client.name},</p>
            <p style="color:#444;line-height:1.6">
              ${lang === "ar" ? `مرفق فاتورتكم <strong>${invoice.number ?? ""}</strong> من ${org.name}.` : `Your invoice <strong>${invoice.number ?? ""}</strong> from ${org.name} is attached.`}
            </p>
            <p style="color:#444;line-height:1.6">
              ${lang === "ar" ? "يمكنكم أيضاً عرض الفاتورة عبر الرابط التالي:" : "You can also view it online:"}
              <a href="${shareUrl}" style="color:#1d3836">${shareUrl}</a>
            </p>
            <p style="color:#888;font-size:13px">${tr("thankYou", lang)}</p>
          </div>`,
        attachments: [
          {
            filename: `${invoice.number ?? "invoice"}.pdf`,
            content: pdf,
          },
        ],
      });
      emailed = true;
    } catch {
      emailed = false;
    }
  }

  return { shareUrl, emailed };
}

export type ActionState = { error?: string; success?: boolean } | null;

function discountToMinor(
  d: { discountType: string; discountValue: number },
  currency: string
): number | null {
  if (d.discountType === "percentage") return Math.round(d.discountValue);
  if (d.discountType === "fixed") return toMinor(d.discountValue, currency);
  return null;
}

function parseInvoiceForm(formData: FormData) {
  const descriptions = formData.getAll("itemDescription");
  const descriptionsAr = formData.getAll("itemDescriptionAr");
  const quantities = formData.getAll("itemQuantity");
  const unitPrices = formData.getAll("itemUnitPrice");
  const taxRates = formData.getAll("itemTaxRate");

  const items = descriptions.map((_, i) => ({
    description: descriptions[i] as string,
    descriptionAr: descriptionsAr[i] as string,
    quantity: quantities[i] as string,
    unitPrice: unitPrices[i] as string,
    taxRate: (taxRates[i] as string) || undefined,
  }));

  return invoiceSchema.safeParse({
    clientId: formData.get("clientId"),
    lang: formData.get("lang"),
    kind: formData.get("kind"),
    currency: formData.get("currency"),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    expiryDate: formData.get("expiryDate"),
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    taxName: formData.get("taxName"),
    taxRate: (formData.get("taxRate") as string) || undefined,
    taxInclusive: formData.get("taxInclusive"),
    template: formData.get("template"),
    notes: formData.get("notes"),
    notesAr: formData.get("notesAr"),
    items,
  });
}

export async function createInvoice(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { org } = await requireOrg();

  const parsed = parseInvoiceForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;
  const client = await prisma.client.findFirst({
    where: { id: d.clientId, orgId: org.id },
  });
  if (!client) return { error: "Client not found" };

  const sendNow = formData.get("sendNow") === "on";
  const discountValue = discountToMinor(d, d.currency);

  const invoice = await prisma.invoice.create({
    data: {
      orgId: org.id,
      clientId: client.id,
      lang: d.lang,
      kind: d.kind,
      currency: d.currency,
      issueDate: new Date(d.issueDate),
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      expiryDate: d.expiryDate ? new Date(d.expiryDate) : null,
      status: sendNow ? "sent" : "draft",
      discountType: d.discountType,
      discountValue,
      taxName: d.taxName || org.defaultTaxName,
      taxRate: d.taxRate !== undefined ? d.taxRate : org.defaultTaxRate,
      taxInclusive: d.taxInclusive,
      template: d.template,
      notes: d.notes || null,
      notesAr: d.notesAr || null,
      items: {
        create: d.items.map((it) => ({
          description: it.description,
          descriptionAr: it.descriptionAr || null,
          quantity: it.quantity,
          unitPrice: toMinor(it.unitPrice, d.currency),
          taxRate: it.taxRate,
        })),
      },
    },
  });

  if (sendNow) {
    await finalizeInvoiceNumber(invoice.id, org.id);
  }

  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

export async function updateInvoice(
  invoiceId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { org } = await requireOrg();

  const existing = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId: org.id },
  });
  if (!existing) return { error: "Invoice not found" };
  if (existing.status !== "draft") {
    return { error: "Only draft invoices can be edited" };
  }

  const parsed = parseInvoiceForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;
  const client = await prisma.client.findFirst({
    where: { id: d.clientId, orgId: org.id },
  });
  if (!client) return { error: "Client not found" };

  const sendNow = formData.get("sendNow") === "on";
  const discountValue = discountToMinor(d, d.currency);

  const invoice = await prisma.$transaction(async (tx) => {
    await tx.lineItem.deleteMany({ where: { invoiceId } });
    return tx.invoice.update({
      where: { id: invoiceId },
      data: {
        clientId: client.id,
        lang: d.lang,
        kind: d.kind,
        currency: d.currency,
        issueDate: new Date(d.issueDate),
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        expiryDate: d.expiryDate ? new Date(d.expiryDate) : null,
        discountType: d.discountType,
        discountValue,
        taxName: d.taxName || org.defaultTaxName,
        taxRate: d.taxRate !== undefined ? d.taxRate : org.defaultTaxRate,
        taxInclusive: d.taxInclusive,
        template: d.template,
        notes: d.notes || null,
        notesAr: d.notesAr || null,
        items: {
          create: d.items.map((it) => ({
            description: it.description,
            descriptionAr: it.descriptionAr || null,
            quantity: it.quantity,
            unitPrice: toMinor(it.unitPrice, d.currency),
            taxRate: it.taxRate,
          })),
        },
      },
    });
  });

  if (sendNow && invoice.status === "draft") {
    await finalizeInvoiceNumber(invoice.id, org.id);
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  redirect(`/invoices/${invoiceId}`);
}

async function finalizeInvoiceNumber(invoiceId: string, orgId: string) {
  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, orgId },
    });
    if (!invoice || invoice.number) return;

    const org = await tx.organization.findUnique({ where: { id: orgId } });
    if (!org) return;

    const seq = org.nextNumber;
    const number = `${org.prefix}-${String(seq).padStart(4, "0")}`;

    await tx.organization.update({
      where: { id: orgId },
      data: { nextNumber: seq + 1 },
    });
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { number, seq, status: "sent" },
    });
  });
}

export async function finalizeInvoice(invoiceId: string): Promise<void> {
  const { org } = await requireOrg();
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId: org.id },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status !== "draft") throw new Error("Only drafts can be sent");

  await finalizeInvoiceNumber(invoiceId, org.id);
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  const { org } = await requireOrg();
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId: org.id },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status !== "draft") {
    throw new Error("Only draft invoices can be deleted");
  }

  await prisma.lineItem.deleteMany({ where: { invoiceId } });
  await prisma.payment.deleteMany({ where: { invoiceId } });
  await prisma.invoice.delete({ where: { id: invoiceId } });
  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function cancelInvoice(invoiceId: string): Promise<void> {
  const { org } = await requireOrg();
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId: org.id },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "paid") throw new Error("Cannot cancel a paid invoice");
  if (invoice.status === "cancelled") throw new Error("Already cancelled");

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "cancelled" },
  });
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function convertQuote(invoiceId: string, toKind: "invoice" | "quote"): Promise<void> {
  const { org } = await requireOrg();
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId: org.id },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "cancelled") throw new Error("Cancelled documents cannot be converted");

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { kind: toKind },
  });
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
}

export async function recordPayment(
  invoiceId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { org } = await requireOrg();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId: org.id },
    include: { items: true, payments: true },
  });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status === "draft") return { error: "Send the invoice before recording payments" };
  if (invoice.status === "cancelled") return { error: "Invoice is cancelled" };

  const parsed = paymentSchema.safeParse({
    amount: formData.get("amount"),
    method: formData.get("method"),
    date: formData.get("date"),
    reference: formData.get("reference"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const totals = withPayments(computeTotals(invoice, invoice.items), invoice.payments, {
    lateFeePercent: org.lateFeePercent,
    invoice,
  });
  const amount = toMinor(parsed.data.amount, invoice.currency);
  if (amount > totals.balance) {
    return { error: "Amount exceeds the balance due" };
  }

  await prisma.payment.create({
    data: {
      invoiceId,
      amount,
      method: parsed.data.method,
      date: new Date(parsed.data.date),
      reference: parsed.data.reference || null,
    },
  });

  const prevPaid = paidAmount(invoice.payments);
  const total = computeTotals(invoice, invoice.items).total;
  if (prevPaid + amount >= total) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "paid" },
    });
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  return { success: true };
}

export async function deletePayment(paymentId: string, invoiceId: string): Promise<void> {
  const { org } = await requireOrg();

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, invoice: { orgId: org.id } },
  });
  if (!payment) throw new Error("Payment not found");

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, orgId: org.id },
  });
  if (!invoice) throw new Error("Invoice not found");

  if (invoice.status === "paid") {
    await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "sent" } });
  }

  await prisma.payment.delete({ where: { id: paymentId } });
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
}

"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { renderPdf, appUrl } from "@/lib/pdf";
import { signPdf, certConfigured, certCommonName } from "@/lib/pdfsign";

export type SignState = { error?: string; success?: boolean; signer?: string } | null;

export async function signInvoicePdf(
  invoiceId: string,
  _prev: SignState,
  formData: FormData
): Promise<SignState> {
  void _prev;
  void formData;
  const { org } = await requireOrg();

  if (!certConfigured(org.signKey, org.signCert)) {
    return {
      error: "No signing certificate configured. Add one in Settings → Digital signature.",
    };
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId: org.id },
  });
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status === "draft" && !invoice.number) {
    return { error: "Send the invoice first so it has a number" };
  }

  try {
    const store = await cookies();
    const pdf = await renderPdf({
      url: appUrl(`/invoices/${invoiceId}/pdf?format=pdf`),
      sessionCookie: store.get("session")?.value,
    });

    const signed = await signPdf(pdf, {
      keyPem: org.signKey!,
      certPem: org.signCert!,
      reason: "Document digitally signed by " + org.name,
      signerName: org.name,
      contactInfo: org.vatId ?? undefined,
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { signedPdf: new Uint8Array(signed), signedAt: new Date() },
    });

    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true, signer: certCommonName(org.signCert!) || org.name };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not sign the PDF" };
  }
}

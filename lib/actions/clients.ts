"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { clientSchema } from "@/lib/validators";

export type ActionState = { error?: string; success?: boolean } | null;

export async function createClient(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { org } = await requireOrg();

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    nameAr: formData.get("nameAr"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    addressAr: formData.get("addressAr"),
    taxId: formData.get("taxId"),
    currency: formData.get("currency"),
    language: formData.get("language"),
    paymentTerms: formData.get("paymentTerms"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  const client = await prisma.client.create({
    data: {
      orgId: org.id,
      name: data.name,
      nameAr: data.nameAr || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      addressAr: data.addressAr || null,
      taxId: data.taxId || null,
      currency: data.currency || null,
      language: data.language,
      paymentTerms: data.paymentTerms,
    },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(
  clientId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { org } = await requireOrg();

  const existing = await prisma.client.findFirst({
    where: { id: clientId, orgId: org.id },
  });
  if (!existing) return { error: "Client not found" };

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    nameAr: formData.get("nameAr"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    addressAr: formData.get("addressAr"),
    taxId: formData.get("taxId"),
    currency: formData.get("currency"),
    language: formData.get("language"),
    paymentTerms: formData.get("paymentTerms"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;
  await prisma.client.update({
    where: { id: clientId },
    data: {
      name: data.name,
      nameAr: data.nameAr || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      addressAr: data.addressAr || null,
      taxId: data.taxId || null,
      currency: data.currency || null,
      language: data.language,
      paymentTerms: data.paymentTerms,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  redirect(`/clients/${clientId}`);
}

export async function deleteClient(clientId: string): Promise<void> {
  const { org } = await requireOrg();

  const count = await prisma.invoice.count({
    where: { orgId: org.id, clientId },
  });
  if (count > 0) {
    throw new Error("Cannot delete a client that has invoices");
  }

  await prisma.client.deleteMany({ where: { id: clientId, orgId: org.id } });
  revalidatePath("/clients");
  redirect("/clients");
}

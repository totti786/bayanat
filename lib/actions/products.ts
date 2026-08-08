"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { toMinor } from "@/lib/money";

export type ProductState = { error?: string; success?: boolean } | null;

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional().default(""),
  description: z.string().optional().default(""),
  unitPrice: z.coerce.number().nonnegative("Price must be >= 0"),
  taxRate: z.coerce.number().min(0).max(100).optional(),
});

function parse(formData: FormData, currency: string) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    nameAr: formData.get("nameAr"),
    description: formData.get("description"),
    unitPrice: formData.get("unitPrice"),
    taxRate: (formData.get("taxRate") as string) || undefined,
  });
  if (!parsed.success) return { parsed, minorPrice: 0 };
  return { parsed, minorPrice: toMinor(parsed.data.unitPrice, currency) };
}

export async function createProduct(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const { org } = await requireOrg();
  const { parsed, minorPrice } = parse(formData, org.defaultCurrency);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const d = parsed.data;
  await prisma.product.create({
    data: {
      orgId: org.id,
      name: d.name,
      nameAr: d.nameAr || null,
      description: d.description || null,
      unitPrice: minorPrice,
      taxRate: d.taxRate ?? null,
    },
  });
  revalidatePath("/catalog");
  return { success: true };
}

export async function updateProduct(
  productId: string,
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const { org } = await requireOrg();
  const { parsed, minorPrice } = parse(formData, org.defaultCurrency);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const existing = await prisma.product.findFirst({ where: { id: productId, orgId: org.id } });
  if (!existing) return { error: "Product not found" };

  const d = parsed.data;
  await prisma.product.update({
    where: { id: productId },
    data: {
      name: d.name,
      nameAr: d.nameAr || null,
      description: d.description || null,
      unitPrice: minorPrice,
      taxRate: d.taxRate ?? null,
    },
  });
  revalidatePath("/catalog");
  return { success: true };
}

export async function deleteProduct(productId: string): Promise<void> {
  const { org } = await requireOrg();
  await prisma.product.deleteMany({ where: { id: productId, orgId: org.id } });
  revalidatePath("/catalog");
}

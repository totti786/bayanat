"use server";

import { revalidatePath } from "next/cache";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { orgSettingsSchema } from "@/lib/validators";
import { generateSelfSignedCert } from "@/lib/pdfsign";
import { audit } from "@/lib/audit";

export type SettingsState = { error?: string; success?: boolean } | null;

export async function generateSignatureCert(): Promise<void> {
  const { org } = await requireOrg();
  const { keyPem, certPem } = generateSelfSignedCert({
    name: org.name,
    country: org.defaultCurrency === "SAR" ? "SA" : "AE",
  });
  await prisma.organization.update({
    where: { id: org.id },
    data: { signKey: keyPem, signCert: certPem },
  });
  revalidatePath("/settings");
}

export async function updateSignature(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { org } = await requireOrg();
  const key = String(formData.get("signKey") ?? "");
  const cert = String(formData.get("signCert") ?? "");
  await prisma.organization.update({
    where: { id: org.id },
    data: { signKey: key || null, signCert: cert || null },
  });
  revalidatePath("/settings");
  return { success: true };
}

export async function updateOrgSettings(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { org, id, email } = await requireOrg();

  const parsed = orgSettingsSchema.safeParse({
    name: formData.get("name"),
    nameAr: formData.get("nameAr"),
    address: formData.get("address"),
    addressAr: formData.get("addressAr"),
    vatId: formData.get("vatId"),
    bankDetails: formData.get("bankDetails"),
    prefix: formData.get("prefix"),
    defaultCurrency: formData.get("defaultCurrency"),
    defaultTaxName: formData.get("defaultTaxName"),
    defaultTaxRate: formData.get("defaultTaxRate"),
    taxInclusive: formData.get("taxInclusive"),
    numerals: formData.get("numerals"),
    defaultTemplate: formData.get("defaultTemplate"),
    hijriDates: formData.get("hijriDates"),
    paymentMethods: formData.get("paymentMethods") ?? "[]",
    lateFeePercent: formData.get("lateFeePercent"),
    reportCurrency: formData.get("reportCurrency"),
    themeAccent: formData.get("themeAccent"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;
  await prisma.organization.update({
    where: { id: org.id },
    data: {
      name: d.name,
      nameAr: d.nameAr || null,
      address: d.address || null,
      addressAr: d.addressAr || null,
      vatId: d.vatId || null,
      bankDetails: d.bankDetails || null,
      prefix: d.prefix,
      defaultCurrency: d.defaultCurrency,
      defaultTaxName: d.defaultTaxName || null,
      defaultTaxRate: d.defaultTaxRate,
      taxInclusive: d.taxInclusive,
      numerals: d.numerals,
      defaultTemplate: d.defaultTemplate,
      hijriDates: d.hijriDates,
      paymentMethods: JSON.stringify(d.paymentMethods),
      lateFeePercent: d.lateFeePercent,
      reportCurrency: d.reportCurrency || null,
      themeAccent: d.themeAccent || null,
    },
  });

  await audit(org.id, { id, email }, { action: "settings.updated", entity: "organization", entityId: org.id });
  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}

const ALLOWED_LOGO_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

async function removeLogoFile(logoUrl: string | null) {
  if (!logoUrl || !logoUrl.startsWith("/logos/")) return;
  const file = path.join(process.cwd(), "public", logoUrl.replace(/^\//, ""));
  await unlink(file).catch(() => {});
}

export async function uploadLogo(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { org } = await requireOrg();

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return { error: "Choose an image file" };
  if (file.size > 2 * 1024 * 1024) return { error: "Logo must be under 2 MB" };

  const ext = ALLOWED_LOGO_TYPES[file.type];
  if (!ext) return { error: "Only PNG, JPEG, or WebP images are allowed" };

  await removeLogoFile(org.logoUrl);

  const dir = path.join(process.cwd(), "public", "logos");
  await mkdir(dir, { recursive: true });
  const filename = `${org.id}-${Date.now()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  await prisma.organization.update({
    where: { id: org.id },
    data: { logoUrl: `/logos/${filename}` },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}

export async function removeLogo(): Promise<void> {
  const { org } = await requireOrg();
  await removeLogoFile(org.logoUrl);
  await prisma.organization.update({
    where: { id: org.id },
    data: { logoUrl: null },
  });
  revalidatePath("/settings");
  revalidatePath("/");
}

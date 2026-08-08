import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  orgName: z.string().min(1, "Organization name is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  address: z.string().optional().default(""),
  addressAr: z.string().optional().default(""),
  taxId: z.string().optional().default(""),
  currency: z.string().optional().default(""),
  language: z.enum(["en", "ar"]).default("en"),
  paymentTerms: z.coerce.number().int().min(0).max(365).default(14),
});

export const paymentMethodsSchema = z
  .string()
  .transform((s) => {
    try {
      const arr = JSON.parse(s);
      return Array.isArray(arr)
        ? arr.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        : [];
    } catch {
      return [];
    }
  });

export const orgSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional().default(""),
  address: z.string().optional().default(""),
  addressAr: z.string().optional().default(""),
  vatId: z.string().optional().default(""),
  bankDetails: z.string().optional().default(""),
  prefix: z.string().min(1, "Prefix is required").max(10),
  defaultCurrency: z.string().min(1).max(10).default("USD"),
  defaultTaxName: z.string().optional().default(""),
  defaultTaxRate: z.coerce.number().min(0).max(100).default(0),
  taxInclusive: z
    .enum(["on", "off"])
    .nullish()
    .transform((v) => v === "on"),
  numerals: z.enum(["western", "eastern"]).default("western"),
  defaultTemplate: z.enum(["classic", "modern", "minimal", "bilingual"]).default("classic"),
  hijriDates: z
    .enum(["on", "off"])
    .nullish()
    .transform((v) => v === "on"),
  signKey: z.string().nullish().transform((v) => v ?? ""),
  signCert: z.string().nullish().transform((v) => v ?? ""),
  paymentMethods: paymentMethodsSchema,
  lateFeePercent: z.coerce.number().min(0).max(100).default(0),
  reportCurrency: z.string().nullish().transform((v) => v ?? ""),
  themeAccent: z.string().nullish().transform((v) => v ?? ""),
});

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  descriptionAr: z.string().optional().default(""),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().nonnegative("Unit price must be >= 0"),
  taxRate: z.coerce.number().min(0).max(100).optional(),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  lang: z.enum(["en", "ar"]).default("en"),
  kind: z.enum(["invoice", "quote"]).default("invoice"),
  currency: z.string().min(1).max(10).default("USD"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().nullish().transform((v) => v ?? ""),
  expiryDate: z.string().nullish().transform((v) => v ?? ""),
  discountType: z.enum(["none", "percentage", "fixed"]).default("none"),
  discountValue: z.coerce.number().min(0).optional().default(0),
  taxName: z.string().optional().default(""),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  taxInclusive: z
    .enum(["on", "off"])
    .nullish()
    .transform((v) => v === "on"),
  template: z.enum(["classic", "modern", "minimal", "bilingual"]).default("classic"),
  notes: z.string().optional().default(""),
  notesAr: z.string().optional().default(""),
  items: z.array(invoiceItemSchema).min(1, "At least one line item is required"),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.string().min(1, "Select a payment method"),
  date: z.string().min(1, "Date is required"),
  reference: z.string().optional().default(""),
});

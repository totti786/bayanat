import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = path.resolve(process.cwd(), url.replace("file:", ""));
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@demo.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed already present. Skipping.");
    return;
  }

  const org = await prisma.organization.create({
    data: {
      name: "Acme Solutions",
      nameAr: "حلول أكمة",
      address: "Office 12, Business Bay, Dubai, UAE",
      addressAr: "مكتب 12، الخليج التجاري، دبي، الإمارات",
      vatId: "100123456700003",
      bankDetails: "Mashreq Bank · IBAN AE07 0030 0000 0000 1234 567",
      prefix: "INV",
      nextNumber: 1,
      defaultCurrency: "AED",
      defaultTaxName: "VAT",
      defaultTaxRate: 5,
      numerals: "western",
      defaultTemplate: "classic",
      paymentMethods: JSON.stringify(["Bank transfer", "Card", "Cash"]),
    },
  });

  await prisma.user.create({
    data: {
      email,
      passwordHash: bcrypt.hashSync("password123", 10),
      name: "Demo Admin",
      role: "admin",
      orgId: org.id,
    },
  });

  const clientEn = await prisma.client.create({
    data: {
      orgId: org.id,
      name: "Skyline Retail",
      nameAr: "سكاي لاين للتجزئة",
      email: "billing@skylinestore.com",
      phone: "+971 50 123 4567",
      address: "Dubai Mall, Dubai, UAE",
      addressAr: "دبي مول، دبي، الإمارات",
      taxId: "100234567800003",
      currency: "AED",
      language: "en",
      paymentTerms: 14,
    },
  });

  const clientAr = await prisma.client.create({
    data: {
      orgId: org.id,
      name: "Crescent Consulting",
      nameAr: "كریسنت للاستشارات",
      email: "finance@crescent.co",
      address: "Corniche Road, Abu Dhabi",
      addressAr: "شارع الكورنيش، أبوظبي",
      currency: "AED",
      language: "ar",
      paymentTerms: 30,
    },
  });

  const invoiceSent = await prisma.invoice.create({
    data: {
      orgId: org.id,
      clientId: clientEn.id,
      number: "INV-0001",
      seq: 1,
      lang: "en",
      currency: "AED",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 86400000),
      status: "sent",
      taxName: "VAT",
      taxRate: 5,
      taxInclusive: false,
      template: "modern",
      items: {
        create: [
          {
            description: "POS system setup",
            descriptionAr: "تركيب نظام نقاط البيع",
            quantity: 1,
            unitPrice: 350000,
            taxRate: 5,
          },
          {
            description: "Monthly support (3 months)",
            descriptionAr: "دعم شهري (٣ أشهر)",
            quantity: 3,
            unitPrice: 45000,
            taxRate: 5,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoiceSent.id,
      amount: 200000,
      method: "bank_transfer",
      date: new Date(),
      reference: "TRX-88213",
    },
  });

  await prisma.invoice.create({
    data: {
      orgId: org.id,
      clientId: clientAr.id,
      lang: "ar",
      currency: "AED",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 86400000),
      status: "draft",
      taxName: "VAT",
      taxRate: 5,
      taxInclusive: true,
      template: "minimal",
      notes: "شكراً لتعاملكم معنا.",
      notesAr: "شكراً لتعاملكم معنا.",
      items: {
        create: [
          {
            description: "Strategy workshop",
            descriptionAr: "ورشة عمل استراتيجية",
            quantity: 2,
            unitPrice: 150000,
            taxRate: 5,
          },
        ],
      },
    },
  });

  console.log(`Seeded org "${org.name}" (${org.id})`);
  console.log(`Admin login: ${email} / password123`);
  console.log(`Invoices: 1 sent (INV-0001), 1 Arabic draft`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

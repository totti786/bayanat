-- ZATCA e-invoicing columns
ALTER TABLE "Organization" ADD COLUMN "zatcaOnboarding" TEXT;
ALTER TABLE "Organization" ADD COLUMN "zatcaCcid" TEXT;
ALTER TABLE "Organization" ADD COLUMN "zatcaSolutionName" TEXT;
ALTER TABLE "Organization" ADD COLUMN "zatcaSolutionVersion" TEXT;
ALTER TABLE "Organization" ADD COLUMN "zatcaPrivateKey" TEXT;
ALTER TABLE "Organization" ADD COLUMN "zatcaCertificate" TEXT;

ALTER TABLE "Invoice" ADD COLUMN "invoiceUuid" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "invoiceHash" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "prevInvoiceHash" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "signedXml" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "zatcaStatus" TEXT NOT NULL DEFAULT 'not_generated';

-- Revert ZATCA e-invoicing columns (not needed)
ALTER TABLE "Organization" DROP COLUMN "zatcaOnboarding";
ALTER TABLE "Organization" DROP COLUMN "zatcaCcid";
ALTER TABLE "Organization" DROP COLUMN "zatcaSolutionName";
ALTER TABLE "Organization" DROP COLUMN "zatcaSolutionVersion";
ALTER TABLE "Organization" DROP COLUMN "zatcaPrivateKey";
ALTER TABLE "Organization" DROP COLUMN "zatcaCertificate";

ALTER TABLE "Invoice" DROP COLUMN "invoiceUuid";
ALTER TABLE "Invoice" DROP COLUMN "invoiceHash";
ALTER TABLE "Invoice" DROP COLUMN "prevInvoiceHash";
ALTER TABLE "Invoice" DROP COLUMN "signedXml";
ALTER TABLE "Invoice" DROP COLUMN "zatcaStatus";

-- PDF digital signature columns
ALTER TABLE "Organization" ADD COLUMN "signKey" TEXT;
ALTER TABLE "Organization" ADD COLUMN "signCert" TEXT;

ALTER TABLE "Invoice" ADD COLUMN "signedPdf" BLOB;
ALTER TABLE "Invoice" ADD COLUMN "signedAt" DATETIME;

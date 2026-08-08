-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "number" TEXT,
    "seq" INTEGER,
    "lang" TEXT NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "discountType" TEXT NOT NULL DEFAULT 'none',
    "discountValue" REAL,
    "taxName" TEXT,
    "taxRate" REAL,
    "taxInclusive" BOOLEAN NOT NULL DEFAULT false,
    "template" TEXT NOT NULL DEFAULT 'classic',
    "notes" TEXT,
    "notesAr" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("clientId", "createdAt", "currency", "discountType", "discountValue", "dueDate", "id", "issueDate", "lang", "notes", "notesAr", "number", "orgId", "seq", "status", "taxInclusive", "taxName", "taxRate") SELECT "clientId", "createdAt", "currency", "discountType", "discountValue", "dueDate", "id", "issueDate", "lang", "notes", "notesAr", "number", "orgId", "seq", "status", "taxInclusive", "taxName", "taxRate" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE TABLE "new_Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "address" TEXT,
    "addressAr" TEXT,
    "vatId" TEXT,
    "bankDetails" TEXT,
    "logoUrl" TEXT,
    "prefix" TEXT NOT NULL DEFAULT 'INV',
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "defaultTaxName" TEXT,
    "defaultTaxRate" REAL,
    "taxInclusive" BOOLEAN NOT NULL DEFAULT false,
    "numerals" TEXT NOT NULL DEFAULT 'western',
    "defaultTemplate" TEXT NOT NULL DEFAULT 'classic',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Organization" ("address", "addressAr", "bankDetails", "createdAt", "defaultCurrency", "defaultTaxName", "defaultTaxRate", "id", "logoUrl", "name", "nameAr", "nextNumber", "numerals", "prefix", "taxInclusive", "vatId") SELECT "address", "addressAr", "bankDetails", "createdAt", "defaultCurrency", "defaultTaxName", "defaultTaxRate", "id", "logoUrl", "name", "nameAr", "nextNumber", "numerals", "prefix", "taxInclusive", "vatId" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

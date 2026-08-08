-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- LineItem: unitPrice Float -> Int (minor units)
CREATE TABLE "new_LineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "quantity" REAL NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "taxRate" REAL,
    CONSTRAINT "LineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LineItem" ("description", "descriptionAr", "id", "invoiceId", "quantity", "taxRate", "unitPrice") SELECT "description", "descriptionAr", "id", "invoiceId", "quantity", "taxRate", CAST(ROUND("unitPrice" * 100) AS INTEGER) FROM "LineItem";
DROP TABLE "LineItem";
ALTER TABLE "new_LineItem" RENAME TO "LineItem";

-- Invoice: discountValue Float -> Int, add kind + expiryDate
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
    "kind" TEXT NOT NULL DEFAULT 'invoice',
    "expiryDate" DATETIME,
    "discountType" TEXT NOT NULL DEFAULT 'none',
    "discountValue" INTEGER,
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
INSERT INTO "new_Invoice" ("clientId", "createdAt", "currency", "discountType", "discountValue", "dueDate", "expiryDate", "id", "issueDate", "kind", "lang", "notes", "notesAr", "number", "orgId", "seq", "status", "taxInclusive", "taxName", "taxRate", "template")
SELECT "clientId", "createdAt", "currency", "discountType",
    CASE
        WHEN "discountType" = 'fixed' THEN CAST(ROUND("discountValue" * 100) AS INTEGER)
        WHEN "discountType" = 'percentage' THEN CAST(ROUND("discountValue") AS INTEGER)
        ELSE NULL
    END,
    "dueDate", NULL, "id", "issueDate", 'invoice', "lang", "notes", "notesAr", "number", "orgId", "seq", "status", "taxInclusive", "taxName", "taxRate", "template"
FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";

-- Payment: amount Float -> Int (minor units)
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "date", "id", "invoiceId", "method", "reference") SELECT CAST(ROUND("amount" * 100) AS INTEGER), "createdAt", "date", "id", "invoiceId", "method", "reference" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";

-- Organization: add hijriDates
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
    "hijriDates" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Organization" ("address", "addressAr", "bankDetails", "createdAt", "defaultCurrency", "defaultTaxName", "defaultTaxRate", "hijriDates", "id", "logoUrl", "name", "nameAr", "nextNumber", "numerals", "prefix", "taxInclusive", "vatId", "defaultTemplate")
SELECT "address", "addressAr", "bankDetails", "createdAt", "defaultCurrency", "defaultTaxName", "defaultTaxRate", false, "id", "logoUrl", "name", "nameAr", "nextNumber", "numerals", "prefix", "taxInclusive", "vatId", "defaultTemplate"
FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";

-- Invite
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'accountant',
    "token" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Invite_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- RecurringRule
CREATE TABLE "RecurringRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "dayOfMonth" INTEGER,
    "lang" TEXT NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'classic',
    "taxName" TEXT,
    "taxRate" REAL,
    "taxInclusive" BOOLEAN NOT NULL DEFAULT false,
    "discountType" TEXT NOT NULL DEFAULT 'none',
    "discountValue" INTEGER,
    "notes" TEXT,
    "notesAr" TEXT,
    "itemsJson" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "nextRun" DATETIME NOT NULL,
    "lastRunAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurringRule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecurringRule_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

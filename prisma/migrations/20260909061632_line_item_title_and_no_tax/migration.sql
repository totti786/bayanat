-- AlterTable
ALTER TABLE "LineItem" ADD COLUMN "title" TEXT;
ALTER TABLE "LineItem" ADD COLUMN "titleAr" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RecurringRule" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringRule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecurringRule_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RecurringRule" ("active", "clientId", "createdAt", "currency", "dayOfMonth", "discountType", "discountValue", "frequency", "id", "interval", "itemsJson", "lang", "lastRunAt", "nextRun", "notes", "notesAr", "orgId", "taxInclusive", "taxName", "taxRate", "template", "updatedAt") SELECT "active", "clientId", "createdAt", "currency", "dayOfMonth", "discountType", "discountValue", "frequency", "id", "interval", "itemsJson", "lang", "lastRunAt", "nextRun", "notes", "notesAr", "orgId", "taxInclusive", "taxName", "taxRate", "template", "updatedAt" FROM "RecurringRule";
DROP TABLE "RecurringRule";
ALTER TABLE "new_RecurringRule" RENAME TO "RecurringRule";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

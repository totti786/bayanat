-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'accountant',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orgId" TEXT,
    CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Organization" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "addressAr" TEXT,
    "taxId" TEXT,
    "currency" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "paymentTerms" INTEGER NOT NULL DEFAULT 14,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
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
    "notes" TEXT,
    "notesAr" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "taxRate" REAL,
    CONSTRAINT "LineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'bank_transfer',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

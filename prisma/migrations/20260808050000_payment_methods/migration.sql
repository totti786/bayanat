-- Custom payment methods: Organization.paymentMethods (JSON array of method labels).
-- Payment.method becomes a free string (SQLite stores it as TEXT already, so no
-- column change is required for existing rows).
ALTER TABLE "Organization" ADD COLUMN "paymentMethods" TEXT NOT NULL DEFAULT '[]';

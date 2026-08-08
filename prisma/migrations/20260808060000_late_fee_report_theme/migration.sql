-- Late fees, report currency, and per-org theme
ALTER TABLE "Organization" ADD COLUMN "lateFeePercent" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN "reportCurrency" TEXT;
ALTER TABLE "Organization" ADD COLUMN "themeAccent" TEXT;

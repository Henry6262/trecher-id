ALTER TABLE "Wallet"
ADD COLUMN "historyCoverageStatus" TEXT,
ADD COLUMN "historyCoverageIssue" TEXT,
ADD COLUMN "historyCoverageUpdatedAt" TIMESTAMP(3),
ADD COLUMN "oldestExactEventAt" TIMESTAMP(3);

ALTER TABLE "WalletSyncAudit"
ADD COLUMN "historyCoverageStatus" TEXT,
ADD COLUMN "historyCoverageIssue" TEXT,
ADD COLUMN "oldestExactEventAt" TIMESTAMP(3);

CREATE INDEX "WalletSyncAudit_historyCoverageStatus_idx" ON "WalletSyncAudit"("historyCoverageStatus");

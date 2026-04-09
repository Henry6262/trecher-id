ALTER TABLE "Wallet"
ADD COLUMN "lastSyncAttemptAt" TIMESTAMP(3),
ADD COLUMN "lastSuccessfulSyncAt" TIMESTAMP(3),
ADD COLUMN "lastSyncStatus" TEXT,
ADD COLUMN "lastSyncError" TEXT,
ADD COLUMN "lastSyncTxnsFetched" INTEGER,
ADD COLUMN "lastSyncTradeRows" INTEGER,
ADD COLUMN "lastSyncEventRows" INTEGER,
ADD COLUMN "syncWarningCode" TEXT;

CREATE INDEX "Wallet_lastSyncStatus_idx" ON "Wallet"("lastSyncStatus");
CREATE INDEX "Wallet_lastSuccessfulSyncAt_idx" ON "Wallet"("lastSuccessfulSyncAt");
CREATE INDEX "Wallet_syncWarningCode_idx" ON "Wallet"("syncWarningCode");

ALTER TABLE "Wallet"
ADD COLUMN "lastContinuityStatus" TEXT,
ADD COLUMN "lastContinuityIssue" TEXT;

CREATE TABLE "WalletSyncAudit" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "syncMode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "previousSignature" TEXT,
    "newestSignature" TEXT,
    "oldestFetchedSignature" TEXT,
    "txnsFetched" INTEGER NOT NULL DEFAULT 0,
    "tradeRows" INTEGER NOT NULL DEFAULT 0,
    "eventRows" INTEGER NOT NULL DEFAULT 0,
    "pagesFetched" INTEGER NOT NULL DEFAULT 0,
    "previousCursorFound" BOOLEAN,
    "reachedHistoryEnd" BOOLEAN,
    "pageLimitReached" BOOLEAN,
    "continuityStatus" TEXT,
    "continuityIssue" TEXT,
    "warningCode" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletSyncAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Wallet_lastContinuityStatus_idx" ON "Wallet"("lastContinuityStatus");
CREATE INDEX "WalletSyncAudit_walletId_attemptedAt_idx" ON "WalletSyncAudit"("walletId", "attemptedAt");
CREATE INDEX "WalletSyncAudit_walletId_createdAt_idx" ON "WalletSyncAudit"("walletId", "createdAt");
CREATE INDEX "WalletSyncAudit_status_idx" ON "WalletSyncAudit"("status");
CREATE INDEX "WalletSyncAudit_continuityStatus_idx" ON "WalletSyncAudit"("continuityStatus");

ALTER TABLE "WalletSyncAudit"
ADD CONSTRAINT "WalletSyncAudit_walletId_fkey"
FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

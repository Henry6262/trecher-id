-- CreateTable
CREATE TABLE "WalletTradeEvent" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "tokenName" TEXT,
    "tokenImageUrl" TEXT,
    "type" TEXT NOT NULL,
    "amountSol" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTradeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletTradeEvent_walletId_signature_tokenMint_type_key" ON "WalletTradeEvent"("walletId", "signature", "tokenMint", "type");

-- CreateIndex
CREATE INDEX "WalletTradeEvent_walletId_timestamp_idx" ON "WalletTradeEvent"("walletId", "timestamp");

-- CreateIndex
CREATE INDEX "WalletTradeEvent_walletId_tokenMint_timestamp_idx" ON "WalletTradeEvent"("walletId", "tokenMint", "timestamp");

-- AddForeignKey
ALTER TABLE "WalletTradeEvent" ADD CONSTRAINT "WalletTradeEvent_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

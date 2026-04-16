-- CreateTable TokenHolding
CREATE TABLE "TokenHolding" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "tokenMint" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "tokenName" TEXT,
    "tokenImageUrl" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "valueUsd" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenHolding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenHolding_walletId_tokenMint_key" ON "TokenHolding"("walletId", "tokenMint");

-- CreateIndex
CREATE INDEX "TokenHolding_walletId_idx" ON "TokenHolding"("walletId");

-- CreateIndex
CREATE INDEX "TokenHolding_walletId_valueUsd_idx" ON "TokenHolding"("walletId", "valueUsd");

-- AddForeignKey
ALTER TABLE "TokenHolding" ADD CONSTRAINT "TokenHolding_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DeployerSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'dune',
    "sourceQueryId" INTEGER,
    "totalDeployed" INTEGER NOT NULL,
    "totalMigrated" INTEGER NOT NULL,
    "graduationRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tokens7d" INTEGER NOT NULL DEFAULT 0,
    "tokens30d" INTEGER NOT NULL DEFAULT 0,
    "validationStatus" TEXT NOT NULL DEFAULT 'valid',
    "validationReason" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPayload" JSONB,

    CONSTRAINT "DeployerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeployerSnapshot_userId_key" ON "DeployerSnapshot"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeployerSnapshot_walletAddress_key" ON "DeployerSnapshot"("walletAddress");

-- CreateIndex
CREATE INDEX "DeployerSnapshot_totalMigrated_tokens7d_totalDeployed_idx" ON "DeployerSnapshot"("totalMigrated" DESC, "tokens7d" DESC, "totalDeployed" DESC);

-- CreateIndex
CREATE INDEX "DeployerSnapshot_validationStatus_syncedAt_idx" ON "DeployerSnapshot"("validationStatus", "syncedAt");

-- AddForeignKey
ALTER TABLE "DeployerSnapshot" ADD CONSTRAINT "DeployerSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

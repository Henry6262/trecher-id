ALTER TABLE "DeployerSnapshot"
ADD COLUMN "enrichmentStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "enrichmentError" TEXT,
ADD COLUMN "lastEnrichedAt" TIMESTAMP(3),
ADD COLUMN "localDeploymentCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "DeployerSnapshot_enrichmentStatus_syncedAt_idx"
ON "DeployerSnapshot"("enrichmentStatus", "syncedAt");

CREATE TABLE "DeployerSyncAudit" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'dune',
    "status" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "limit" INTEGER,
    "skipEnrichment" BOOLEAN NOT NULL DEFAULT false,
    "deployersFetched" INTEGER NOT NULL DEFAULT 0,
    "deployersValid" INTEGER NOT NULL DEFAULT 0,
    "deployersInvalid" INTEGER NOT NULL DEFAULT 0,
    "usersCreated" INTEGER NOT NULL DEFAULT 0,
    "usersUpdated" INTEGER NOT NULL DEFAULT 0,
    "enrichmentsSucceeded" INTEGER NOT NULL DEFAULT 0,
    "enrichmentsFailed" INTEGER NOT NULL DEFAULT 0,
    "snapshotWarnings" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeployerSyncAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeployerSyncAudit_attemptedAt_idx"
ON "DeployerSyncAudit"("attemptedAt");

CREATE INDEX "DeployerSyncAudit_status_attemptedAt_idx"
ON "DeployerSyncAudit"("status", "attemptedAt");

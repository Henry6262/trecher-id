-- AlterTable
ALTER TABLE "UserRanking"
ADD COLUMN "rank" INTEGER;

-- CreateIndex
CREATE INDEX "UserRanking_period_rank_idx" ON "UserRanking"("period", "rank");

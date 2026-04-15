-- Make totalPnlPercent nullable: null = no cost basis; 0 = genuine break-even
ALTER TABLE "PinnedTrade" ALTER COLUMN "totalPnlPercent" DROP NOT NULL;

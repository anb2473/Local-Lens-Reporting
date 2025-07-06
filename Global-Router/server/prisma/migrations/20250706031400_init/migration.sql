-- AlterTable
ALTER TABLE "News" ADD COLUMN     "averagePlausability" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "contentReliability" JSONB,
ADD COLUMN     "titleReliability" JSONB;

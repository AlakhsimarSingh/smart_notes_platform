-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "embedding" JSONB,
ADD COLUMN     "searchVector" TEXT;

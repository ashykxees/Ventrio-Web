-- DropIndex
DROP INDEX "CoachApplication_userId_key";

-- AlterTable
ALTER TABLE "CoachApplication" ADD COLUMN "decidedAt" DATETIME;

-- CreateIndex
CREATE INDEX "CoachApplication_userId_createdAt_idx" ON "CoachApplication"("userId", "createdAt");

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "orbitAchievementIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

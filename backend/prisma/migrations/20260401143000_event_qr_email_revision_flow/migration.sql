-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'NEEDS_REVISION';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "moderationComment" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "EventAttendee"
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "emailConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EventChecker" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventChecker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventChecker_eventId_userId_key" ON "EventChecker"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "EventChecker" ADD CONSTRAINT "EventChecker_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventChecker" ADD CONSTRAINT "EventChecker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

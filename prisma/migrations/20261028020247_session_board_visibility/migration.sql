-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CoachSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coachId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "objectives" TEXT NOT NULL DEFAULT '',
    "audience" TEXT NOT NULL DEFAULT '',
    "startAt" DATETIME NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "meetingUrl" TEXT NOT NULL DEFAULT '',
    "prepNotes" TEXT NOT NULL DEFAULT '',
    "resources" TEXT NOT NULL DEFAULT '',
    "notesForLeadership" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "weekKey" TEXT,
    "leadershipFeedback" TEXT NOT NULL DEFAULT '',
    "hiddenFromBoard" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoachSession_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "CoachProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CoachSession" ("audience", "cancelledAt", "coachId", "createdAt", "durationMinutes", "id", "leadershipFeedback", "meetingUrl", "notesForLeadership", "objectives", "platform", "prepNotes", "resources", "sessionType", "startAt", "status", "timezone", "title", "topic", "updatedAt", "weekKey") SELECT "audience", "cancelledAt", "coachId", "createdAt", "durationMinutes", "id", "leadershipFeedback", "meetingUrl", "notesForLeadership", "objectives", "platform", "prepNotes", "resources", "sessionType", "startAt", "status", "timezone", "title", "topic", "updatedAt", "weekKey" FROM "CoachSession";
DROP TABLE "CoachSession";
ALTER TABLE "new_CoachSession" RENAME TO "CoachSession";
CREATE INDEX "CoachSession_startAt_idx" ON "CoachSession"("startAt");
CREATE UNIQUE INDEX "CoachSession_coachId_weekKey_key" ON "CoachSession"("coachId", "weekKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

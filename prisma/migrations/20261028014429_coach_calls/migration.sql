-- CreateTable
CREATE TABLE "CoachCall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coachId" TEXT NOT NULL,
    "sessionId" TEXT,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "dmsSent" INTEGER NOT NULL DEFAULT 0,
    "dmsFailed" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CoachCall_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "CoachProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoachCall_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoachSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CallAttendee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "callId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CallAttendee_callId_fkey" FOREIGN KEY ("callId") REFERENCES "CoachCall" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CallFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "callId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CallFeedback_callId_fkey" FOREIGN KEY ("callId") REFERENCES "CoachCall" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CoachCall_coachId_endedAt_idx" ON "CoachCall"("coachId", "endedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CallAttendee_callId_discordId_key" ON "CallAttendee"("callId", "discordId");

-- CreateIndex
CREATE UNIQUE INDEX "CallFeedback_callId_discordId_key" ON "CallFeedback"("callId", "discordId");

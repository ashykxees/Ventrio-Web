-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CoachProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "coachRole" TEXT NOT NULL DEFAULT '',
    "expertise" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "responsibilities" TEXT NOT NULL DEFAULT '',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "availability" TEXT NOT NULL DEFAULT '',
    "startDate" DATETIME,
    "leadershipNotes" TEXT NOT NULL DEFAULT '',
    "discordRoles" TEXT NOT NULL DEFAULT '',
    "rolesCheckedAt" DATETIME,
    "headline" TEXT NOT NULL DEFAULT '',
    "skills" TEXT NOT NULL DEFAULT '',
    "yearsExperience" INTEGER,
    "credentials" TEXT NOT NULL DEFAULT '',
    "helpWith" TEXT NOT NULL DEFAULT '',
    "showCoachingOnProfile" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CoachProfile" ("availability", "bio", "coachRole", "createdAt", "credentials", "discordId", "discordRoles", "expertise", "headline", "helpWith", "id", "leadershipNotes", "responsibilities", "rolesCheckedAt", "showCoachingOnProfile", "skills", "startDate", "status", "timezone", "updatedAt", "userId", "yearsExperience") SELECT "availability", "bio", "coachRole", "createdAt", "credentials", "discordId", "discordRoles", "expertise", "headline", "helpWith", "id", "leadershipNotes", "responsibilities", "rolesCheckedAt", "showCoachingOnProfile", "skills", "startDate", "status", "timezone", "updatedAt", "userId", "yearsExperience" FROM "CoachProfile";
DROP TABLE "CoachProfile";
ALTER TABLE "new_CoachProfile" RENAME TO "CoachProfile";
CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");
CREATE UNIQUE INDEX "CoachProfile_discordId_key" ON "CoachProfile"("discordId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Coaches who haven't filled in the new Business & coaching page yet stay hidden until they opt in.
UPDATE "CoachProfile" SET "showCoachingOnProfile" = false
WHERE "headline" = '' AND "skills" = '' AND "credentials" = '' AND "helpWith" = '' AND "yearsExperience" IS NULL;

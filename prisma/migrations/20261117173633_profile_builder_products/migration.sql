-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'WEBSITE',
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "siteName" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT NOT NULL DEFAULT '',
    "image" BLOB,
    "imageType" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "showCoachingOnProfile" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CoachProfile" ("availability", "bio", "coachRole", "createdAt", "discordId", "discordRoles", "expertise", "id", "leadershipNotes", "responsibilities", "rolesCheckedAt", "startDate", "status", "timezone", "updatedAt", "userId") SELECT "availability", "bio", "coachRole", "createdAt", "discordId", "discordRoles", "expertise", "id", "leadershipNotes", "responsibilities", "rolesCheckedAt", "startDate", "status", "timezone", "updatedAt", "userId" FROM "CoachProfile";
DROP TABLE "CoachProfile";
ALTER TABLE "new_CoachProfile" RENAME TO "CoachProfile";
CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");
CREATE UNIQUE INDEX "CoachProfile_discordId_key" ON "CoachProfile"("discordId");
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "discordUsername" TEXT NOT NULL,
    "discordAvatar" TEXT,
    "handle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "projectName" TEXT NOT NULL DEFAULT '',
    "interests" TEXT NOT NULL DEFAULT '',
    "skills" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "socialLinks" TEXT NOT NULL DEFAULT '',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "showAvatar" BOOLEAN NOT NULL DEFAULT true,
    "showBio" BOOLEAN NOT NULL DEFAULT true,
    "showProjectName" BOOLEAN NOT NULL DEFAULT true,
    "showInterests" BOOLEAN NOT NULL DEFAULT true,
    "showSkills" BOOLEAN NOT NULL DEFAULT true,
    "showLinks" BOOLEAN NOT NULL DEFAULT false,
    "showProducts" BOOLEAN NOT NULL DEFAULT true,
    "joinedGuildAt" DATETIME,
    "notifyOnLaunch" BOOLEAN NOT NULL DEFAULT true,
    "launchNotifiedAt" DATETIME,
    "launchNotifyError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("bio", "createdAt", "discordAvatar", "discordId", "discordUsername", "displayName", "handle", "id", "interests", "isPublic", "joinedGuildAt", "launchNotifiedAt", "launchNotifyError", "notifyOnLaunch", "projectName", "showAvatar", "showBio", "showInterests", "showLinks", "showProjectName", "showSkills", "skills", "socialLinks", "updatedAt", "userId", "website") SELECT "bio", "createdAt", "discordAvatar", "discordId", "discordUsername", "displayName", "handle", "id", "interests", "isPublic", "joinedGuildAt", "launchNotifiedAt", "launchNotifyError", "notifyOnLaunch", "projectName", "showAvatar", "showBio", "showInterests", "showLinks", "showProjectName", "showSkills", "skills", "socialLinks", "updatedAt", "userId", "website" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
CREATE UNIQUE INDEX "Profile_discordId_key" ON "Profile"("discordId");
CREATE UNIQUE INDEX "Profile_handle_key" ON "Profile"("handle");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Product_userId_position_idx" ON "Product"("userId", "position");

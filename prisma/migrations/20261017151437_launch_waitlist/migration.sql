-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "joinedGuildAt" DATETIME,
    "notifyOnLaunch" BOOLEAN NOT NULL DEFAULT true,
    "launchNotifiedAt" DATETIME,
    "launchNotifyError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("bio", "createdAt", "discordAvatar", "discordId", "discordUsername", "displayName", "handle", "id", "interests", "isPublic", "projectName", "showAvatar", "showBio", "showInterests", "showLinks", "showProjectName", "showSkills", "skills", "socialLinks", "updatedAt", "userId", "website") SELECT "bio", "createdAt", "discordAvatar", "discordId", "discordUsername", "displayName", "handle", "id", "interests", "isPublic", "projectName", "showAvatar", "showBio", "showInterests", "showLinks", "showProjectName", "showSkills", "skills", "socialLinks", "updatedAt", "userId", "website" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
CREATE UNIQUE INDEX "Profile_discordId_key" ON "Profile"("discordId");
CREATE UNIQUE INDEX "Profile_handle_key" ON "Profile"("handle");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

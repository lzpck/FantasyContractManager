-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "sleeperOwnerId" TEXT,
    "ownerDisplayName" TEXT,
    "sleeperTeamId" TEXT,
    "currentSalaryCap" REAL NOT NULL DEFAULT 0,
    "currentDeadMoney" REAL NOT NULL DEFAULT 0,
    "nextSeasonDeadMoney" REAL NOT NULL DEFAULT 0,
    "leagueId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "teams_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teams_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_teams" ("createdAt", "currentDeadMoney", "currentSalaryCap", "id", "leagueId", "name", "ownerDisplayName", "ownerId", "sleeperOwnerId", "sleeperTeamId", "updatedAt") SELECT "createdAt", "currentDeadMoney", "currentSalaryCap", "id", "leagueId", "name", "ownerDisplayName", "ownerId", "sleeperOwnerId", "sleeperTeamId", "updatedAt" FROM "teams";
DROP TABLE "teams";
ALTER TABLE "new_teams" RENAME TO "teams";
CREATE UNIQUE INDEX "teams_leagueId_sleeperOwnerId_key" ON "teams"("leagueId", "sleeperOwnerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

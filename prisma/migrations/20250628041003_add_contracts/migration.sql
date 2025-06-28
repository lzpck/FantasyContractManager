/*
  Warnings:

  - A unique constraint covering the columns `[leagueId,sleeperOwnerId]` on the table `teams` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fantasyPositions` to the `players` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "teams_leagueId_ownerId_key";

-- AlterTable
ALTER TABLE "teams" ADD COLUMN "ownerDisplayName" TEXT;
ALTER TABLE "teams" ADD COLUMN "sleeperOwnerId" TEXT;

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "currentSalary" REAL NOT NULL,
    "originalSalary" REAL NOT NULL,
    "yearsRemaining" INTEGER NOT NULL,
    "originalYears" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "acquisitionType" TEXT NOT NULL,
    "signedSeason" INTEGER NOT NULL,
    "hasBeenTagged" BOOLEAN NOT NULL DEFAULT false,
    "hasBeenExtended" BOOLEAN NOT NULL DEFAULT false,
    "hasFourthYearOption" BOOLEAN NOT NULL DEFAULT false,
    "fourthYearOptionActivated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contracts_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contracts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contracts_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "fantasyPositions" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "age" INTEGER,
    "sleeperPlayerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_players" ("age", "createdAt", "id", "isActive", "name", "position", "sleeperPlayerId", "team", "updatedAt") SELECT "age", "createdAt", "id", "isActive", "name", "position", "sleeperPlayerId", "team", "updatedAt" FROM "players";
DROP TABLE "players";
ALTER TABLE "new_players" RENAME TO "players";
CREATE UNIQUE INDEX "players_sleeperPlayerId_key" ON "players"("sleeperPlayerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "teams_leagueId_sleeperOwnerId_key" ON "teams"("leagueId", "sleeperOwnerId");

-- CreateTable
CREATE TABLE "team_rosters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sleeperPlayerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "team_rosters_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE,
    CONSTRAINT "team_rosters_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "team_rosters_teamId_playerId_key" ON "team_rosters"("teamId", "playerId");

-- CreateIndex
CREATE INDEX "team_rosters_teamId_idx" ON "team_rosters"("teamId");

-- CreateIndex
CREATE INDEX "team_rosters_sleeperPlayerId_idx" ON "team_rosters"("sleeperPlayerId");
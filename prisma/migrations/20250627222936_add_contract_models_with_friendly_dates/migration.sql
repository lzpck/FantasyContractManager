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
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contracts_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contracts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contracts_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "franchise_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "tagValue" REAL NOT NULL,
    "previousSalary" REAL NOT NULL,
    "positionAverage" REAL NOT NULL,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "franchise_tags_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "franchise_tags_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "franchise_tags_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contract_extensions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalContractId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "newSalary" REAL NOT NULL,
    "newYears" INTEGER NOT NULL,
    "negotiatedSeason" INTEGER NOT NULL,
    "effectiveSeason" INTEGER NOT NULL,
    "negotiatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contract_extensions_originalContractId_fkey" FOREIGN KEY ("originalContractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contract_extensions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contract_extensions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dead_money" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "currentSeasonAmount" REAL NOT NULL,
    "nextSeasonAmount" REAL NOT NULL,
    "cutSeason" INTEGER NOT NULL,
    "wasPracticeSquad" BOOLEAN NOT NULL DEFAULT false,
    "cutAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dead_money_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dead_money_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dead_money_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cap_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT,
    "contractId" TEXT,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cap_movements_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cap_movements_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cap_movements_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "draft_picks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueId" TEXT NOT NULL,
    "originalTeamId" TEXT NOT NULL,
    "currentTeamId" TEXT NOT NULL,
    "selectedPlayerId" TEXT,
    "season" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "pick" INTEGER NOT NULL,
    "overallPick" INTEGER NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "draftDate" DATETIME,
    "selectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "draft_picks_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "draft_picks_originalTeamId_fkey" FOREIGN KEY ("originalTeamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "draft_picks_currentTeamId_fkey" FOREIGN KEY ("currentTeamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "draft_picks_selectedPlayerId_fkey" FOREIGN KEY ("selectedPlayerId") REFERENCES "players" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_playerId_teamId_signedSeason_key" ON "contracts"("playerId", "teamId", "signedSeason");

-- CreateIndex
CREATE UNIQUE INDEX "franchise_tags_contractId_season_key" ON "franchise_tags"("contractId", "season");

-- CreateIndex
CREATE UNIQUE INDEX "contract_extensions_originalContractId_key" ON "contract_extensions"("originalContractId");

-- CreateIndex
CREATE UNIQUE INDEX "draft_picks_leagueId_season_overallPick_key" ON "draft_picks"("leagueId", "season", "overallPick");

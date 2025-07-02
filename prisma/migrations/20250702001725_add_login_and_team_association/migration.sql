-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "login" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TEXT,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "teamId" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "users_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TEXT NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "salaryCap" REAL NOT NULL,
    "totalTeams" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sleeperLeagueId" TEXT,
    "maxFranchiseTags" INTEGER NOT NULL DEFAULT 1,
    "annualIncreasePercentage" REAL NOT NULL DEFAULT 15.0,
    "minimumSalary" REAL NOT NULL DEFAULT 1.0,
    "seasonTurnoverDate" TEXT NOT NULL DEFAULT '04-01',
    "deadMoneyConfig" TEXT NOT NULL DEFAULT '{"currentSeason":1.0,"futureSeasons":{"1":0,"2":0.5,"3":0.75,"4":1.0}}',
    "commissionerId" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "leagues_commissionerId_fkey" FOREIGN KEY ("commissionerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teams" (
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
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "teams_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teams_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "fantasyPositions" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "age" INTEGER,
    "sleeperPlayerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "team_rosters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sleeperPlayerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "team_rosters_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_rosters_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "contracts_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contracts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contracts_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dead_money" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "contractId" TEXT,
    "amount" REAL NOT NULL,
    "year" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dead_money_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "dead_money_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dead_money_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_teamId_key" ON "users"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "teams_leagueId_sleeperOwnerId_key" ON "teams"("leagueId", "sleeperOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "players_sleeperPlayerId_key" ON "players"("sleeperPlayerId");

-- CreateIndex
CREATE INDEX "team_rosters_teamId_idx" ON "team_rosters"("teamId");

-- CreateIndex
CREATE INDEX "team_rosters_sleeperPlayerId_idx" ON "team_rosters"("sleeperPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "team_rosters_teamId_playerId_key" ON "team_rosters"("teamId", "playerId");

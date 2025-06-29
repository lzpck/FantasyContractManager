-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_contracts" (
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
INSERT INTO "new_contracts" ("acquisitionType", "createdAt", "currentSalary", "fourthYearOptionActivated", "hasBeenExtended", "hasBeenTagged", "hasFourthYearOption", "id", "leagueId", "originalSalary", "originalYears", "playerId", "signedSeason", "status", "teamId", "updatedAt", "yearsRemaining") SELECT "acquisitionType", "createdAt", "currentSalary", "fourthYearOptionActivated", "hasBeenExtended", "hasBeenTagged", "hasFourthYearOption", "id", "leagueId", "originalSalary", "originalYears", "playerId", "signedSeason", "status", "teamId", "updatedAt", "yearsRemaining" FROM "contracts";
DROP TABLE "contracts";
ALTER TABLE "new_contracts" RENAME TO "contracts";
CREATE TABLE "new_leagues" (
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
INSERT INTO "new_leagues" ("annualIncreasePercentage", "commissionerId", "createdAt", "id", "maxFranchiseTags", "minimumSalary", "name", "salaryCap", "season", "seasonTurnoverDate", "sleeperLeagueId", "status", "totalTeams", "updatedAt") SELECT "annualIncreasePercentage", "commissionerId", "createdAt", "id", "maxFranchiseTags", "minimumSalary", "name", "salaryCap", "season", "seasonTurnoverDate", "sleeperLeagueId", "status", "totalTeams", "updatedAt" FROM "leagues";
DROP TABLE "leagues";
ALTER TABLE "new_leagues" RENAME TO "leagues";
CREATE TABLE "new_players" (
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
INSERT INTO "new_players" ("age", "createdAt", "fantasyPositions", "id", "isActive", "name", "position", "sleeperPlayerId", "team", "updatedAt") SELECT "age", "createdAt", "fantasyPositions", "id", "isActive", "name", "position", "sleeperPlayerId", "team", "updatedAt" FROM "players";
DROP TABLE "players";
ALTER TABLE "new_players" RENAME TO "players";
CREATE UNIQUE INDEX "players_sleeperPlayerId_key" ON "players"("sleeperPlayerId");
CREATE TABLE "new_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TEXT NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sessions" ("expires", "id", "sessionToken", "userId") SELECT "expires", "id", "sessionToken", "userId" FROM "sessions";
DROP TABLE "sessions";
ALTER TABLE "new_sessions" RENAME TO "sessions";
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");
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
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "teams_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teams_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_teams" ("abbreviation", "createdAt", "currentDeadMoney", "currentSalaryCap", "id", "leagueId", "name", "nextSeasonDeadMoney", "ownerDisplayName", "ownerId", "sleeperOwnerId", "sleeperTeamId", "updatedAt") SELECT "abbreviation", "createdAt", "currentDeadMoney", "currentSalaryCap", "id", "leagueId", "name", "nextSeasonDeadMoney", "ownerDisplayName", "ownerId", "sleeperOwnerId", "sleeperTeamId", "updatedAt" FROM "teams";
DROP TABLE "teams";
ALTER TABLE "new_teams" RENAME TO "teams";
CREATE UNIQUE INDEX "teams_leagueId_sleeperOwnerId_key" ON "teams"("leagueId", "sleeperOwnerId");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TEXT,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_users" ("createdAt", "email", "emailVerified", "id", "image", "isActive", "name", "password", "role", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "isActive", "name", "password", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE TABLE "new_verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TEXT NOT NULL
);
INSERT INTO "new_verification_tokens" ("expires", "identifier", "token") SELECT "expires", "identifier", "token" FROM "verification_tokens";
DROP TABLE "verification_tokens";
ALTER TABLE "new_verification_tokens" RENAME TO "verification_tokens";
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

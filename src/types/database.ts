// ============================================================================
// TIPOS DE BANCO DE DADOS
// ============================================================================
// Este arquivo contém tipos extraídos do Prisma para uso no frontend,
// evitando importações diretas do Prisma Client no lado do cliente.

export enum UserRole {
  COMMISSIONER = 'COMMISSIONER',
  USER = 'USER',
}

export enum LeagueStatus {
  ACTIVE = 'active',
  OFFSEASON = 'offseason',
  ARCHIVED = 'archived',
}

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  role: UserRole;
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

export interface League {
  id: string;
  name: string;
  sleeperLeagueId: string;
  season: number;
  salaryCap: number;
  totalTeams: number;
  status: LeagueStatus;
  maxFranchiseTags: number;
  annualIncreasePercentage: number;
  minimumSalary: number;
  seasonTurnoverDate: string;
  commissionerId: string;
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

export interface Team {
  id: string;
  name: string;
  abbreviation?: string | null;
  sleeperTeamId?: string | null;
  sleeperOwnerId?: string | null;
  ownerDisplayName?: string | null;
  currentSalaryCap?: number | null;
  currentDeadMoney?: number | null;
  nextSeasonDeadMoney?: number | null;
  leagueId: string;
  ownerId: string;
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

export interface Player {
  id: string;
  name: string;
  position: string;
  fantasyPositions: string;
  team?: string | null;
  age?: number | null;
  sleeperPlayerId: string;
  isActive: boolean;
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TAGGED = 'TAGGED',
  EXTENDED = 'EXTENDED',
  CUT = 'CUT',
}

export enum AcquisitionType {
  AUCTION = 'auction',
  FAAB = 'faab',
  ROOKIE_DRAFT = 'rookie_draft',
  TRADE = 'trade',
  UNDISPUTED = 'undisputed',
}

export interface Contract {
  id: string;
  playerId: string;
  teamId: string;
  leagueId: string;
  currentSalary: number;
  originalSalary: number;
  yearsRemaining: number;
  originalYears: number;
  status: ContractStatus;
  acquisitionType: AcquisitionType;
  signedSeason: number;
  hasBeenTagged: boolean;
  hasBeenExtended: boolean;
  hasFourthYearOption: boolean;
  fourthYearOptionActivated: boolean;
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

/**
 * Dados fictícios para o usuário de demonstração
 *
 * Este arquivo contém todos os dados mock que serão exibidos exclusivamente
 * para o usuário demo@demo.com, proporcionando uma experiência completa
 * de demonstração sem afetar dados reais de outros usuários.
 */

import {
  User,
  League,
  Team,
  Player,
  Contract,
  PlayerWithContract,
  TeamFinancialSummary,
  LeagueStatus,
  ContractStatus,
  PlayerPosition,
  AcquisitionType,
  UserRole,
} from '@/types';

// ============================================================================
// USUÁRIO DEMO
// ============================================================================

export const DEMO_USER: User = {
  id: 'demo-user-id',
  name: 'Usuário Demonstração',
  email: 'demo@demo.com',
  avatar: undefined,
  role: UserRole.USER,
  isActive: true,
  isCommissioner: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
};

// ============================================================================
// LIGAS DEMO
// ============================================================================

export const DEMO_LEAGUES: League[] = [
  {
    id: 'demo-league-1',
    name: 'Liga The Bad Place - Demo',
    sleeperLeagueId: 'demo-sleeper-1',
    season: 2024,
    salaryCap: 279000000, // $279M
    totalTeams: 12,
    status: LeagueStatus.ACTIVE,
    maxFranchiseTags: 1,
    annualIncreasePercentage: 15,
    minimumSalary: 1000000, // $1M
    seasonTurnoverDate: '2024-04-01',
    commissionerId: 'demo-user-id',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    settings: {
      maxFranchiseTags: 1,
      annualIncreasePercentage: 15,
      minimumSalary: 1000000,
      seasonTurnoverDate: '2024-04-01',
      rookieDraft: {
        rounds: 3,
        firstRoundFourthYearOption: true,
        salaryTable: [],
      },
    },
  },
  {
    id: 'demo-league-2',
    name: 'Liga Elite Fantasy - Demo',
    sleeperLeagueId: 'demo-sleeper-2',
    season: 2024,
    salaryCap: 250000000, // $250M
    totalTeams: 10,
    status: LeagueStatus.OFFSEASON,
    maxFranchiseTags: 2,
    annualIncreasePercentage: 12,
    minimumSalary: 500000, // $500K
    seasonTurnoverDate: '2024-03-15',
    commissionerId: 'demo-user-id',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    settings: {
      maxFranchiseTags: 2,
      annualIncreasePercentage: 12,
      minimumSalary: 500000,
      seasonTurnoverDate: '2024-03-15',
      rookieDraft: {
        rounds: 3,
        firstRoundFourthYearOption: false,
        salaryTable: [],
      },
    },
  },
];

// ============================================================================
// TIMES DEMO
// ============================================================================

export const DEMO_TEAMS: Team[] = [
  {
    id: 'demo-team-1',
    name: 'Forklift Certified',
    sleeperTeamId: 'demo-sleeper-team-1',
    leagueId: 'demo-league-1',
    ownerId: 'demo-user-id',
    sleeperOwnerId: 'demo-sleeper-owner-1',
    ownerDisplayName: 'DemoOwner1',
    abbreviation: 'FKL',
    availableCap: 34000000,
    currentDeadMoney: 5000000,
    nextSeasonDeadMoney: 0,
    franchiseTagsUsed: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-team-2',
    name: 'The Gronk Spikes',
    sleeperTeamId: 'demo-sleeper-team-2',
    leagueId: 'demo-league-1',
    ownerId: 'other-user-1',
    sleeperOwnerId: 'demo-sleeper-owner-2',
    ownerDisplayName: 'DemoOwner2',
    abbreviation: 'GRK',
    availableCap: 11000000,
    currentDeadMoney: 2500000,
    nextSeasonDeadMoney: 0,
    franchiseTagsUsed: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
];

// ============================================================================
// JOGADORES DEMO
// ============================================================================

export const DEMO_PLAYERS: Player[] = [
  {
    id: 'demo-player-1',
    name: 'Josh Allen',
    position: PlayerPosition.QB,
    fantasyPositions: [PlayerPosition.QB],
    sleeperPlayerId: 'demo-sleeper-player-1',
    nflTeam: 'BUF',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-player-2',
    name: 'Christian McCaffrey',
    position: PlayerPosition.RB,
    fantasyPositions: [PlayerPosition.RB],
    sleeperPlayerId: 'demo-sleeper-player-2',
    nflTeam: 'SF',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-player-3',
    name: 'Cooper Kupp',
    position: PlayerPosition.WR,
    fantasyPositions: [PlayerPosition.WR],
    sleeperPlayerId: 'demo-sleeper-player-3',
    nflTeam: 'LAR',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-player-4',
    name: 'Travis Kelce',
    position: PlayerPosition.TE,
    fantasyPositions: [PlayerPosition.TE],
    sleeperPlayerId: 'demo-sleeper-player-4',
    nflTeam: 'KC',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
];

// ============================================================================
// CONTRATOS DEMO
// ============================================================================

export const DEMO_CONTRACTS: Contract[] = [
  {
    id: 'demo-contract-1',
    playerId: 'demo-player-1',
    teamId: 'demo-team-1',
    leagueId: 'demo-league-1',
    currentSalary: 45000000, // $45M
    originalSalary: 35000000, // $35M
    yearsRemaining: 2,
    originalYears: 4,
    acquisitionType: AcquisitionType.AUCTION,
    status: ContractStatus.ACTIVE,
    signedSeason: 2022,
    hasBeenExtended: false,
    hasBeenTagged: false,
    hasFourthYearOption: false,
    fourthYearOptionActivated: false,
    createdAt: new Date('2022-04-01'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-contract-2',
    playerId: 'demo-player-2',
    teamId: 'demo-team-1',
    leagueId: 'demo-league-1',
    currentSalary: 38000000, // $38M
    originalSalary: 28000000, // $28M
    yearsRemaining: 1,
    originalYears: 3,
    acquisitionType: AcquisitionType.FAAB,
    status: ContractStatus.ACTIVE,
    signedSeason: 2022,
    hasBeenExtended: false,
    hasBeenTagged: false,
    hasFourthYearOption: false,
    fourthYearOptionActivated: false,
    createdAt: new Date('2022-04-01'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-contract-3',
    playerId: 'demo-player-3',
    teamId: 'demo-team-1',
    leagueId: 'demo-league-1',
    currentSalary: 29000000, // $29M
    originalSalary: 25000000, // $25M
    yearsRemaining: 2,
    originalYears: 3,
    acquisitionType: AcquisitionType.AUCTION,
    status: ContractStatus.ACTIVE,
    signedSeason: 2023,
    hasBeenExtended: false,
    hasBeenTagged: false,
    hasFourthYearOption: false,
    fourthYearOptionActivated: false,
    createdAt: new Date('2023-05-01'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-contract-4',
    playerId: 'demo-player-4',
    teamId: 'demo-team-1',
    leagueId: 'demo-league-1',
    currentSalary: 30000000, // $30M
    originalSalary: 20000000, // $20M
    yearsRemaining: 1,
    originalYears: 4,
    acquisitionType: AcquisitionType.AUCTION,
    status: ContractStatus.ACTIVE,
    signedSeason: 2020,
    hasBeenExtended: true,
    hasBeenTagged: false,
    hasFourthYearOption: false,
    fourthYearOptionActivated: false,
    createdAt: new Date('2020-04-01'),
    updatedAt: new Date(),
  },
];

// ============================================================================
// JOGADORES COM CONTRATOS DEMO
// ============================================================================

export const DEMO_PLAYERS_WITH_CONTRACTS: PlayerWithContract[] = DEMO_PLAYERS.map(player => {
  const contract = DEMO_CONTRACTS.find(c => c.playerId === player.id);
  if (!contract) {
    throw new Error(`Contrato não encontrado para o jogador ${player.id}`);
  }
  return {
    player,
    contract,
  };
});

// ============================================================================
// RESUMO FINANCEIRO DEMO
// ============================================================================

export const DEMO_TEAM_FINANCIAL_SUMMARY: TeamFinancialSummary = {
  team: DEMO_TEAMS[0],
  totalSalaries: 245000000,
  availableCap: 34000000,
  currentDeadMoney: 5000000,
  nextSeasonDeadMoney: 0,
  projectedNextSeasonCap: 279000000,
  contractsExpiring: 3,
  playersWithContracts: [],
};

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Verifica se um usuário é o usuário de demonstração
 */
export function isDemoUser(email?: string | null): boolean {
  return email === 'demo@demo.com';
}

/**
 * Retorna dados de ligas para o usuário demo
 */
export function getDemoLeagues(): League[] {
  return DEMO_LEAGUES;
}

/**
 * Retorna dados de times para o usuário demo
 */
export function getDemoTeams(leagueId?: string): Team[] {
  if (leagueId) {
    return DEMO_TEAMS.filter(team => team.leagueId === leagueId);
  }
  return DEMO_TEAMS;
}

/**
 * Retorna dados de jogadores para o usuário demo
 */
export function getDemoPlayers(): Player[] {
  return DEMO_PLAYERS;
}

/**
 * Retorna dados de contratos para o usuário demo
 */
export function getDemoContracts(teamId?: string): Contract[] {
  if (teamId) {
    return DEMO_CONTRACTS.filter(contract => contract.teamId === teamId);
  }
  return DEMO_CONTRACTS;
}

/**
 * Retorna jogadores com contratos para o usuário demo
 */
export function getDemoPlayersWithContracts(teamId?: string): PlayerWithContract[] {
  if (teamId) {
    return DEMO_PLAYERS_WITH_CONTRACTS.filter(
      player => player.contract && player.contract.teamId === teamId,
    );
  }
  return DEMO_PLAYERS_WITH_CONTRACTS;
}

/**
 * Retorna resumo financeiro para o usuário demo
 */
export function getDemoTeamFinancialSummary(): TeamFinancialSummary {
  // Para simplificar, retorna sempre o mesmo resumo
  // Em uma implementação real, seria calculado baseado no teamId
  return DEMO_TEAM_FINANCIAL_SUMMARY;
}

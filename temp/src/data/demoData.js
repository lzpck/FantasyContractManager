'use strict';
/**
 * Dados fictícios para o usuário de demonstração
 *
 * Este arquivo contém todos os dados mock que serão exibidos exclusivamente
 * para o usuário demo@demo.com, proporcionando uma experiência completa
 * de demonstração sem afetar dados reais de outros usuários.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.DEMO_TEAM_FINANCIAL_SUMMARY =
  exports.DEMO_PLAYERS_WITH_CONTRACTS =
  exports.DEMO_CONTRACTS =
  exports.DEMO_PLAYERS =
  exports.DEMO_TEAMS =
  exports.DEMO_LEAGUES =
  exports.DEMO_USER =
    void 0;
exports.isDemoUser = isDemoUser;
exports.getDemoLeagues = getDemoLeagues;
exports.getDemoTeams = getDemoTeams;
exports.getDemoPlayers = getDemoPlayers;
exports.getDemoContracts = getDemoContracts;
exports.getDemoPlayersWithContracts = getDemoPlayersWithContracts;
exports.getDemoTeamFinancialSummary = getDemoTeamFinancialSummary;
const types_1 = require('@/types');
// ============================================================================
// USUÁRIO DEMO
// ============================================================================
exports.DEMO_USER = {
  id: 'demo-user-id',
  name: 'Usuário Demonstração',
  email: 'demo@demo.com',
  avatar: undefined,
  role: types_1.UserRole.USER,
  isActive: true,
  isCommissioner: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
};
// ============================================================================
// LIGAS DEMO
// ============================================================================
exports.DEMO_LEAGUES = [
  {
    id: 'demo-league-1',
    name: 'Liga The Bad Place - Demo',
    sleeperLeagueId: 'demo-sleeper-1',
    season: 2024,
    salaryCap: 279000000, // $279M
    totalTeams: 12,
    status: types_1.LeagueStatus.ACTIVE,
    maxFranchiseTags: 1,
    annualIncreasePercentage: 15,
    minimumSalary: 1000000, // $1M
    seasonTurnoverDate: '2024-04-01',
    commissionerId: 'demo-user-id',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
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
    status: types_1.LeagueStatus.OFFSEASON,
    maxFranchiseTags: 2,
    annualIncreasePercentage: 12,
    minimumSalary: 500000, // $500K
    seasonTurnoverDate: '2024-03-15',
    commissionerId: 'demo-user-id',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
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
exports.DEMO_TEAMS = [
  {
    id: 'demo-team-1',
    name: 'Forklift Certified',
    sleeperTeamId: 'demo-sleeper-team-1',
    leagueId: 'demo-league-1',
    ownerId: 'demo-user-id',
    sleeperOwnerId: 'demo-sleeper-owner-1',
    ownerDisplayName: 'João Silva',
    abbreviation: 'FKL',
    availableCap: 34000000,
    currentDeadMoney: 5000000,
    nextSeasonDeadMoney: 2000000,
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
    ownerDisplayName: 'Maria Santos',
    abbreviation: 'GRK',
    availableCap: 11000000,
    currentDeadMoney: 2500000,
    nextSeasonDeadMoney: 1000000,
    franchiseTagsUsed: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-team-3',
    name: 'Dynasty Warriors',
    sleeperTeamId: 'demo-sleeper-team-3',
    leagueId: 'demo-league-1',
    ownerId: 'other-user-2',
    sleeperOwnerId: 'demo-sleeper-owner-3',
    ownerDisplayName: 'Carlos Oliveira',
    abbreviation: 'DYN',
    availableCap: 45000000,
    currentDeadMoney: 0,
    nextSeasonDeadMoney: 0,
    franchiseTagsUsed: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-team-4',
    name: 'Touchdown Titans',
    sleeperTeamId: 'demo-sleeper-team-4',
    leagueId: 'demo-league-1',
    ownerId: 'other-user-3',
    sleeperOwnerId: 'demo-sleeper-owner-4',
    ownerDisplayName: 'Ana Costa',
    abbreviation: 'TTN',
    availableCap: 8500000,
    currentDeadMoney: 7500000,
    nextSeasonDeadMoney: 3000000,
    franchiseTagsUsed: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-team-5',
    name: 'Fantasy Legends',
    sleeperTeamId: 'demo-sleeper-team-5',
    leagueId: 'demo-league-1',
    ownerId: 'other-user-4',
    sleeperOwnerId: 'demo-sleeper-owner-5',
    ownerDisplayName: 'Pedro Almeida',
    abbreviation: 'FLG',
    availableCap: 22000000,
    currentDeadMoney: 1500000,
    nextSeasonDeadMoney: 500000,
    franchiseTagsUsed: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-team-6',
    name: 'Salary Cap Hell',
    sleeperTeamId: 'demo-sleeper-team-6',
    leagueId: 'demo-league-1',
    ownerId: 'other-user-5',
    sleeperOwnerId: 'demo-sleeper-owner-6',
    ownerDisplayName: 'Lucas Ferreira',
    abbreviation: 'SCH',
    availableCap: 2000000,
    currentDeadMoney: 12000000,
    nextSeasonDeadMoney: 8000000,
    franchiseTagsUsed: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
];
// ============================================================================
// JOGADORES DEMO
// ============================================================================
exports.DEMO_PLAYERS = [
  {
    id: 'demo-player-1',
    name: 'Josh Allen',
    position: types_1.PlayerPosition.QB,
    fantasyPositions: [types_1.PlayerPosition.QB],
    sleeperPlayerId: 'demo-sleeper-player-1',
    nflTeam: 'BUF',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-player-2',
    name: 'Christian McCaffrey',
    position: types_1.PlayerPosition.RB,
    fantasyPositions: [types_1.PlayerPosition.RB],
    sleeperPlayerId: 'demo-sleeper-player-2',
    nflTeam: 'SF',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-player-3',
    name: 'Cooper Kupp',
    position: types_1.PlayerPosition.WR,
    fantasyPositions: [types_1.PlayerPosition.WR],
    sleeperPlayerId: 'demo-sleeper-player-3',
    nflTeam: 'LAR',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'demo-player-4',
    name: 'Travis Kelce',
    position: types_1.PlayerPosition.TE,
    fantasyPositions: [types_1.PlayerPosition.TE],
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
exports.DEMO_CONTRACTS = [
  {
    id: 'demo-contract-1',
    playerId: 'demo-player-1',
    teamId: 'demo-team-1',
    leagueId: 'demo-league-1',
    currentSalary: 45000000, // $45M
    originalSalary: 35000000, // $35M
    yearsRemaining: 2,
    originalYears: 4,
    acquisitionType: types_1.AcquisitionType.AUCTION,
    status: types_1.ContractStatus.ACTIVE,
    signedSeason: 2022,
    hasBeenExtended: false,
    hasBeenTagged: false,
    hasFourthYearOption: false,
    fourthYearOptionActivated: false,
    createdAt: '2022-04-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
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
    acquisitionType: types_1.AcquisitionType.FAAB,
    status: types_1.ContractStatus.ACTIVE,
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
    acquisitionType: types_1.AcquisitionType.AUCTION,
    status: types_1.ContractStatus.ACTIVE,
    signedSeason: 2023,
    hasBeenExtended: false,
    hasBeenTagged: false,
    hasFourthYearOption: false,
    fourthYearOptionActivated: false,
    createdAt: '2023-05-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
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
    acquisitionType: types_1.AcquisitionType.AUCTION,
    status: types_1.ContractStatus.ACTIVE,
    signedSeason: 2020,
    hasBeenExtended: true,
    hasBeenTagged: false,
    hasFourthYearOption: false,
    fourthYearOptionActivated: false,
    createdAt: '2020-04-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];
// ============================================================================
// JOGADORES COM CONTRATOS DEMO
// ============================================================================
exports.DEMO_PLAYERS_WITH_CONTRACTS = exports.DEMO_PLAYERS.map(player => {
  const contract = exports.DEMO_CONTRACTS.find(c => c.playerId === player.id);
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
exports.DEMO_TEAM_FINANCIAL_SUMMARY = {
  team: exports.DEMO_TEAMS[0],
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
function isDemoUser(email) {
  return email === 'demo@demo.com';
}
/**
 * Retorna dados de ligas para o usuário demo
 */
function getDemoLeagues() {
  return exports.DEMO_LEAGUES;
}
/**
 * Retorna dados de times para o usuário demo
 */
function getDemoTeams(leagueId) {
  if (leagueId) {
    return exports.DEMO_TEAMS.filter(team => team.leagueId === leagueId);
  }
  return exports.DEMO_TEAMS;
}
/**
 * Retorna dados de jogadores para o usuário demo
 */
function getDemoPlayers() {
  return exports.DEMO_PLAYERS;
}
/**
 * Retorna dados de contratos para o usuário demo
 */
function getDemoContracts(teamId) {
  if (teamId) {
    return exports.DEMO_CONTRACTS.filter(contract => contract.teamId === teamId);
  }
  return exports.DEMO_CONTRACTS;
}
/**
 * Retorna jogadores com contratos para o usuário demo
 */
function getDemoPlayersWithContracts(teamId) {
  if (teamId) {
    return exports.DEMO_PLAYERS_WITH_CONTRACTS.filter(
      player => player.contract && player.contract.teamId === teamId,
    );
  }
  return exports.DEMO_PLAYERS_WITH_CONTRACTS;
}
/**
 * Retorna resumo financeiro para o usuário demo
 */
function getDemoTeamFinancialSummary() {
  // Para simplificar, retorna sempre o mesmo resumo
  // Em uma implementação real, seria calculado baseado no teamId
  return exports.DEMO_TEAM_FINANCIAL_SUMMARY;
}

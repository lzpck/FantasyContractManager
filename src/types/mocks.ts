/**
 * Funções utilitárias para gerar dados mock/fake das entidades
 * do sistema para testes e desenvolvimento
 */

import {
  User,
  League,
  Team,
  Player,
  Contract,
  FranchiseTag,
  ContractExtension,
  DeadMoney,
  DraftPick,
  PlayerWithContract,
  TeamFinancialSummary,
  LeagueStatus,
  ContractStatus,
  PlayerPosition,
  AcquisitionType,
  LeagueSettings,
  RookieDraftSettings,
  RookieSalaryTable,
} from './index';

// ============================================================================
// DADOS MOCK PARA DESENVOLVIMENTO
// ============================================================================

/**
 * Tabela padrão de salários para rookie draft
 */
export const DEFAULT_ROOKIE_SALARY_TABLE: RookieSalaryTable[] = [
  // 1ª Rodada
  {
    pick: 1,
    round: 1,
    firstYearSalary: 3.5,
    secondYearSalary: 4.0,
    thirdYearSalary: 4.6,
    fourthYearSalary: 5.3,
  },
  {
    pick: 2,
    round: 1,
    firstYearSalary: 3.2,
    secondYearSalary: 3.7,
    thirdYearSalary: 4.3,
    fourthYearSalary: 4.9,
  },
  {
    pick: 3,
    round: 1,
    firstYearSalary: 3.0,
    secondYearSalary: 3.5,
    thirdYearSalary: 4.0,
    fourthYearSalary: 4.6,
  },
  {
    pick: 4,
    round: 1,
    firstYearSalary: 2.8,
    secondYearSalary: 3.2,
    thirdYearSalary: 3.7,
    fourthYearSalary: 4.3,
  },
  {
    pick: 5,
    round: 1,
    firstYearSalary: 2.6,
    secondYearSalary: 3.0,
    thirdYearSalary: 3.5,
    fourthYearSalary: 4.0,
  },
  {
    pick: 6,
    round: 1,
    firstYearSalary: 2.4,
    secondYearSalary: 2.8,
    thirdYearSalary: 3.2,
    fourthYearSalary: 3.7,
  },
  {
    pick: 7,
    round: 1,
    firstYearSalary: 2.2,
    secondYearSalary: 2.5,
    thirdYearSalary: 2.9,
    fourthYearSalary: 3.3,
  },
  {
    pick: 8,
    round: 1,
    firstYearSalary: 2.0,
    secondYearSalary: 2.3,
    thirdYearSalary: 2.6,
    fourthYearSalary: 3.0,
  },
  {
    pick: 9,
    round: 1,
    firstYearSalary: 1.9,
    secondYearSalary: 2.2,
    thirdYearSalary: 2.5,
    fourthYearSalary: 2.9,
  },
  {
    pick: 10,
    round: 1,
    firstYearSalary: 1.8,
    secondYearSalary: 2.1,
    thirdYearSalary: 2.4,
    fourthYearSalary: 2.8,
  },
  {
    pick: 11,
    round: 1,
    firstYearSalary: 1.7,
    secondYearSalary: 2.0,
    thirdYearSalary: 2.3,
    fourthYearSalary: 2.6,
  },
  {
    pick: 12,
    round: 1,
    firstYearSalary: 1.6,
    secondYearSalary: 1.8,
    thirdYearSalary: 2.1,
    fourthYearSalary: 2.4,
  },

  // 2ª Rodada
  { pick: 13, round: 2, firstYearSalary: 1.5, secondYearSalary: 1.7, thirdYearSalary: 2.0 },
  { pick: 14, round: 2, firstYearSalary: 1.4, secondYearSalary: 1.6, thirdYearSalary: 1.8 },
  { pick: 15, round: 2, firstYearSalary: 1.3, secondYearSalary: 1.5, thirdYearSalary: 1.7 },
  { pick: 16, round: 2, firstYearSalary: 1.2, secondYearSalary: 1.4, thirdYearSalary: 1.6 },
  { pick: 17, round: 2, firstYearSalary: 1.1, secondYearSalary: 1.3, thirdYearSalary: 1.5 },
  { pick: 18, round: 2, firstYearSalary: 1.0, secondYearSalary: 1.2, thirdYearSalary: 1.4 },
  { pick: 19, round: 2, firstYearSalary: 1.0, secondYearSalary: 1.1, thirdYearSalary: 1.3 },
  { pick: 20, round: 2, firstYearSalary: 1.0, secondYearSalary: 1.1, thirdYearSalary: 1.2 },
  { pick: 21, round: 2, firstYearSalary: 1.0, secondYearSalary: 1.1, thirdYearSalary: 1.2 },
  { pick: 22, round: 2, firstYearSalary: 1.0, secondYearSalary: 1.1, thirdYearSalary: 1.2 },
  { pick: 23, round: 2, firstYearSalary: 1.0, secondYearSalary: 1.1, thirdYearSalary: 1.2 },
  { pick: 24, round: 2, firstYearSalary: 1.0, secondYearSalary: 1.1, thirdYearSalary: 1.2 },

  // 3ª Rodada
  { pick: 25, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.1 },
  { pick: 26, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.1 },
  { pick: 27, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.1 },
  { pick: 28, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.1 },
  { pick: 29, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.1 },
  { pick: 30, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.1 },
  { pick: 31, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.1 },
  { pick: 32, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.1 },
  { pick: 33, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.1 },
  { pick: 34, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.1 },
  { pick: 35, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.1 },
  { pick: 36, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.1 },
];

// ============================================================================
// FUNÇÕES PARA GERAR DADOS MOCK
// ============================================================================

/**
 * Gera um usuário mock para testes
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  const now = new Date();
  return {
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    name: 'João Silva',
    email: 'joao@example.com',
    avatar: undefined,
    isCommissioner: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Gera um usuário comissário mock para testes
 */
export function createMockCommissioner(overrides: Partial<User> = {}): User {
  return createMockUser({
    name: 'Comissário da Liga',
    email: 'commissioner@example.com',
    isCommissioner: true,
    ...overrides,
  });
}

/**
 * Gera configurações padrão de liga
 */
export function createDefaultLeagueSettings(): LeagueSettings {
  const rookieDraft: RookieDraftSettings = {
    rounds: 3,
    firstRoundFourthYearOption: true,
    salaryTable: DEFAULT_ROOKIE_SALARY_TABLE,
  };

  return {
    maxFranchiseTags: 1,
    annualIncreasePercentage: 15,
    minimumSalary: 1000000, // $1M
    seasonTurnoverDate: '04-01', // 1º de abril
    rookieDraft,
  };
}

/**
 * Gera uma liga mock para testes
 */
export function createMockLeague(overrides: Partial<League> = {}): League {
  const now = new Date();
  return {
    id: `league-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Liga The Bad Place',
    season: 2024,
    salaryCap: 279000000, // $279M
    totalTeams: 12,
    status: LeagueStatus.ACTIVE,
    settings: createDefaultLeagueSettings(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Gera um time mock para testes
 */
export function createMockTeam(
  leagueId: string,
  ownerId: string,
  overrides: Partial<Team> = {},
): Team {
  const now = new Date();
  return {
    id: `team-${Math.random().toString(36).substr(2, 9)}`,
    leagueId,
    ownerId,
    name: 'Time Exemplo',
    abbreviation: 'TEX',
    logo: undefined,
    availableCap: 50000000, // $50M disponível
    currentDeadMoney: 0,
    nextSeasonDeadMoney: 0,
    franchiseTagsUsed: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Gera um jogador mock para testes
 */
export function createMockPlayer(overrides: Partial<Player> = {}): Player {
  const now = new Date();
  const positions = Object.values(PlayerPosition);
  const randomPosition = positions[Math.floor(Math.random() * positions.length)];

  return {
    id: `player-${Math.random().toString(36).substr(2, 9)}`,
    sleeperPlayerId: `sleeper-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Jogador Exemplo',
    position: randomPosition,
    nflTeam: 'KC',
    jerseyNumber: Math.floor(Math.random() * 99) + 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Gera um contrato mock para testes
 */
export function createMockContract(
  playerId: string,
  teamId: string,
  leagueId: string,
  overrides: Partial<Contract> = {},
): Contract {
  const now = new Date();
  const salary = 15000000; // $15M padrão

  return {
    id: `contract-${Math.random().toString(36).substr(2, 9)}`,
    playerId,
    teamId,
    leagueId,
    currentSalary: salary,
    originalSalary: salary,
    yearsRemaining: 3,
    originalYears: 3,
    status: ContractStatus.ACTIVE,
    acquisitionType: AcquisitionType.AUCTION,
    signedSeason: 2024,
    hasBeenTagged: false,
    hasBeenExtended: false,
    hasFourthYearOption: false,
    fourthYearOptionActivated: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Gera uma Franchise Tag mock para testes
 */
export function createMockFranchiseTag(
  contractId: string,
  playerId: string,
  teamId: string,
  overrides: Partial<FranchiseTag> = {},
): FranchiseTag {
  const previousSalary = 20000000; // $20M
  const positionAverage = 25000000; // $25M
  const salaryWith15Percent = previousSalary * 1.15;
  const tagValue = Math.max(salaryWith15Percent, positionAverage);

  return {
    id: `tag-${Math.random().toString(36).substr(2, 9)}`,
    contractId,
    playerId,
    teamId,
    season: 2024,
    tagValue,
    previousSalary,
    positionAverage,
    appliedAt: new Date(),
    ...overrides,
  };
}

/**
 * Gera uma extensão de contrato mock para testes
 */
export function createMockContractExtension(
  originalContractId: string,
  playerId: string,
  teamId: string,
  overrides: Partial<ContractExtension> = {},
): ContractExtension {
  return {
    id: `extension-${Math.random().toString(36).substr(2, 9)}`,
    originalContractId,
    playerId,
    teamId,
    newSalary: 25000000, // $25M
    newYears: 3,
    negotiatedSeason: 2024,
    effectiveSeason: 2025,
    negotiatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Gera dead money mock para testes
 */
export function createMockDeadMoney(
  contractId: string,
  playerId: string,
  teamId: string,
  overrides: Partial<DeadMoney> = {},
): DeadMoney {
  const totalAmount = 10000000; // $10M

  return {
    id: `dead-${Math.random().toString(36).substr(2, 9)}`,
    contractId,
    playerId,
    teamId,
    totalAmount,
    currentSeasonAmount: totalAmount * 0.75, // 75% no ano atual
    nextSeasonAmount: totalAmount * 0.25, // 25% no próximo ano
    cutSeason: 2024,
    wasPracticeSquad: false,
    cutAt: new Date(),
    ...overrides,
  };
}

/**
 * Gera um pick do draft mock para testes
 */
export function createMockDraftPick(
  leagueId: string,
  teamId: string,
  round: number,
  pick: number,
  overrides: Partial<DraftPick> = {},
): DraftPick {
  const overallPick = (round - 1) * 12 + pick; // Assumindo 12 times

  return {
    id: `pick-${Math.random().toString(36).substr(2, 9)}`,
    leagueId,
    originalTeamId: teamId,
    currentTeamId: teamId,
    season: 2024,
    round,
    pick,
    overallPick,
    isUsed: false,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Gera um jogador com contrato completo para testes
 */
export function createMockPlayerWithContract(
  teamId: string,
  leagueId: string,
  overrides: {
    player?: Partial<Player>;
    contract?: Partial<Contract>;
  } = {},
): PlayerWithContract {
  const player = createMockPlayer(overrides.player);
  const contract = createMockContract(player.id, teamId, leagueId, overrides.contract);

  return {
    player,
    contract,
  };
}

/**
 * Gera um resumo financeiro de time mock para testes
 */
export function createMockTeamFinancialSummary(
  team: Team,
  playersCount: number = 5,
): TeamFinancialSummary {
  const playersWithContracts: PlayerWithContract[] = [];
  let totalSalaries = 0;
  let contractsExpiring = 0;

  for (let i = 0; i < playersCount; i++) {
    const playerWithContract = createMockPlayerWithContract(team.id, team.leagueId);
    playersWithContracts.push(playerWithContract);
    totalSalaries += playerWithContract.contract.currentSalary;

    if (playerWithContract.contract.yearsRemaining === 1) {
      contractsExpiring++;
    }
  }

  const availableCap = 279000000 - totalSalaries; // $279M - salários
  const projectedNextSeasonCap = availableCap - totalSalaries * 0.15; // Considerando aumento de 15%

  return {
    team,
    totalSalaries,
    availableCap,
    currentDeadMoney: team.currentDeadMoney,
    nextSeasonDeadMoney: team.nextSeasonDeadMoney,
    projectedNextSeasonCap,
    contractsExpiring,
    playersWithContracts,
  };
}

/**
 * Gera uma liga completa com times e jogadores para testes
 */
export function createMockLeagueWithTeams(teamsCount: number = 12): {
  league: League;
  teams: Team[];
  users: User[];
  playersWithContracts: PlayerWithContract[];
} {
  const league = createMockLeague();
  const users: User[] = [];
  const teams: Team[] = [];
  const playersWithContracts: PlayerWithContract[] = [];

  // Criar usuários e times
  for (let i = 0; i < teamsCount; i++) {
    const user = createMockUser({
      name: `Proprietário ${i + 1}`,
      email: `owner${i + 1}@example.com`,
    });
    users.push(user);

    const team = createMockTeam(league.id, user.id, {
      name: `Time ${i + 1}`,
      abbreviation: `T${i + 1}`.padStart(3, '0'),
    });
    teams.push(team);

    // Adicionar alguns jogadores para cada time
    for (let j = 0; j < 3; j++) {
      const playerWithContract = createMockPlayerWithContract(team.id, league.id, {
        player: {
          name: `Jogador ${i + 1}-${j + 1}`,
        },
      });
      playersWithContracts.push(playerWithContract);
    }
  }

  return {
    league,
    teams,
    users,
    playersWithContracts,
  };
}

const mockUtils = {
  createMockUser,
  createMockLeague,
  createMockTeam,
  createMockPlayer,
  createMockContract,
  createMockFranchiseTag,
  createMockContractExtension,
  createMockDeadMoney,
  createMockDraftPick,
  createMockPlayerWithContract,
  createMockTeamFinancialSummary,
  createMockLeagueWithTeams,
  createDefaultLeagueSettings,
  DEFAULT_ROOKIE_SALARY_TABLE,
};

export default mockUtils;

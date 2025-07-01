/**
 * Funções utilitárias para gerenciamento de contratos e salary cap
 * Implementa as regras principais da liga de fantasy football
 *
 * Regras implementadas:
 * - Aumento anual de 15% nos salários
 * - Dead money: 25% por ano restante + salário atual
 * - Franchise Tag: maior entre salário+15% ou média top 10
 * - Extensões: só no último ano, só uma vez na carreira
 * - Validações de salary cap
 */

import {
  Contract,
  Team,
  Player,
  ContractStatus,
  PlayerPosition,
  AcquisitionType,
  FranchiseTagCalculation,
  DeadMoneyConfig,
} from '../types';
import { toISOString } from '@/utils/formatUtils';

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

/**
 * Projeção do salary cap de um time para anos futuros
 */
export interface CapProjection {
  /** Ano da projeção */
  year: number;
  /** Total de salários comprometidos */
  committedSalaries: number;
  /** Dead money previsto */
  deadMoney: number;
  /** Cap disponível */
  availableCap: number;
  /** Contratos que expiram neste ano */
  expiringContracts: number;
}

/**
 * Resultado do cálculo de dead money
 */
export interface DeadMoneyCalculation {
  /** Valor total do dead money */
  totalAmount: number;
  /** Valor que afeta a temporada atual */
  currentSeasonAmount: number;
  /** Valor que afeta a próxima temporada */
  nextSeasonAmount: number;
  /** Detalhamento do cálculo */
  breakdown: {
    currentYearSalary: number;
    remainingYears: number;
    penaltyPerYear: number;
  };
}

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Calcula o salário de um contrato com aumento anual de 15%
 *
 * @param contract - Contrato do jogador
 * @param targetYear - Ano para o qual calcular o salário (relativo ao ano de assinatura)
 * @returns Salário calculado para o ano especificado
 *
 * @example
 * // Contrato assinado em 2024 por $10M
 * const salary2025 = calculateAnnualSalary(contract, 1); // $11.5M (10 * 1.15^1)
 * const salary2026 = calculateAnnualSalary(contract, 2); // $13.225M (10 * 1.15^2)
 */
export function calculateAnnualSalary(contract: Contract, targetYear: number): number {
  if (targetYear < 0) {
    throw new Error('Ano alvo não pode ser negativo');
  }

  // Fórmula: salário_original * (1.15 ^ anos_passados)
  const annualIncreaseRate = 1.15;
  const calculatedSalary = contract.originalSalary * Math.pow(annualIncreaseRate, targetYear);

  // Arredonda para 2 casas decimais (centavos de milhão)
  return Math.round(calculatedSalary * 100) / 100;
}

/**
 * Calcula o dead money ao cortar um jogador
 *
 * Regras customizáveis por liga:
 * - Salário do ano atual: percentual configurável (padrão 100%)
 * - Anos restantes: percentual configurável por quantidade de anos restantes
 * - Practice squad: apenas 25% do salário atual, zero para próxima temporada
 *
 * @param contract - Contrato do jogador
 * @param cutYear - Ano em que o jogador foi cortado (relativo ao ano de assinatura)
 * @param isPracticeSquad - Se o jogador estava no practice squad
 * @param deadMoneyConfig - Configuração de dead money da liga (opcional, usa padrão se não fornecido)
 * @returns Cálculo detalhado do dead money
 */
export function calculateDeadMoney(
  contract: Contract,
  cutYear: number,
  isPracticeSquad: boolean = false,
  deadMoneyConfig?: DeadMoneyConfig,
): DeadMoneyCalculation {
  // Usar configuração padrão se não fornecida (conforme documentação)
  const config = deadMoneyConfig || {
    currentSeason: 1.0,
    futureSeasons: {
      '1': 0,
      '2': 0.5,
      '3': 0.75,
      '4': 1.0,
    },
  };

  const currentYearSalary = calculateAnnualSalary(contract, cutYear);
  const yearsRemaining = contract.originalYears - cutYear - 1;

  let currentSeasonAmount: number;
  let nextSeasonAmount: number;

  if (isPracticeSquad) {
    // Practice squad: sempre 25% do salário atual, independente da configuração
    currentSeasonAmount = currentYearSalary * 0.25;
    nextSeasonAmount = 0;
  } else {
    // Jogador regular: usar configuração da liga
    currentSeasonAmount = currentYearSalary * config.currentSeason;

    // Calcular penalidade baseada nos anos restantes e configuração
    let remainingYearsPenalty = 0;
    if (yearsRemaining > 0) {
      // Obter percentual baseado nos anos restantes
      const yearsKey = Math.min(yearsRemaining, 4).toString() as keyof typeof config.futureSeasons;
      const penaltyPercentage = config.futureSeasons[yearsKey] || 0;

      // Aplicar percentual ao salário total dos anos restantes
      for (let year = cutYear + 1; year < contract.originalYears; year++) {
        const yearSalary = calculateAnnualSalary(contract, year);
        remainingYearsPenalty += yearSalary * penaltyPercentage;
      }
    }
    nextSeasonAmount = remainingYearsPenalty;
  }

  const totalAmount = currentSeasonAmount + nextSeasonAmount;

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    currentSeasonAmount: Math.round(currentSeasonAmount * 100) / 100,
    nextSeasonAmount: Math.round(nextSeasonAmount * 100) / 100,
    breakdown: {
      currentYearSalary,
      remainingYears: yearsRemaining,
      penaltyPerYear: isPracticeSquad ? 0 : currentYearSalary * 0.25,
    },
  };
}

/**
 * Verifica se um contrato pode receber extensão
 *
 * Regras:
 * - Só pode estender no último ano do contrato
 * - Jogador só pode ser estendido uma vez na carreira
 * - Contrato deve estar ativo
 *
 * @param contract - Contrato do jogador
 * @returns Se pode estender e motivo caso não possa
 */
export function canExtendContract(contract: Contract): { canExtend: boolean; reason?: string } {
  // Verifica se contrato está ativo
  if (contract.status !== ContractStatus.ACTIVE) {
    return {
      canExtend: false,
      reason: 'Contrato não está ativo',
    };
  }

  // Verifica se já foi estendido antes
  if (contract.hasBeenExtended) {
    return {
      canExtend: false,
      reason: 'Jogador já foi estendido uma vez na carreira',
    };
  }

  // Verifica se está no último ano
  if (contract.yearsRemaining > 1) {
    return {
      canExtend: false,
      reason: `Só pode estender no último ano. Anos restantes: ${contract.yearsRemaining}`,
    };
  }

  return { canExtend: true };
}

/**
 * Verifica se pode aplicar Franchise Tag a um jogador
 *
 * Regras:
 * - Jogador nunca pode ter sido tagueado antes
 * - Time não pode ter excedido o limite de tags da temporada
 * - Contrato deve estar no último ano ou expirado
 *
 * @param contract - Contrato do jogador
 * @param tagsUsedByTeam - Número de tags já usadas pelo time na temporada
 * @param maxTagsPerSeason - Limite máximo de tags por temporada
 * @returns Se pode aplicar tag e motivo caso não possa
 */
export function canApplyFranchiseTag(
  contract: Contract,
  tagsUsedByTeam: number,
  maxTagsPerSeason: number = 1,
): { canTag: boolean; reason?: string } {
  // Verifica se jogador já foi tagueado antes
  if (contract.hasBeenTagged) {
    return {
      canTag: false,
      reason: 'Jogador já foi tagueado anteriormente',
    };
  }

  // Verifica se time ainda tem tags disponíveis
  if (tagsUsedByTeam >= maxTagsPerSeason) {
    return {
      canTag: false,
      reason: `Time já usou o máximo de tags permitidas (${maxTagsPerSeason})`,
    };
  }

  // Verifica se contrato está no último ano ou expirado
  if (contract.yearsRemaining > 1) {
    return {
      canTag: false,
      reason: 'Só pode aplicar tag no último ano do contrato',
    };
  }

  return { canTag: true };
}

/**
 * Calcula o valor da Franchise Tag para um jogador
 *
 * Regra: maior valor entre:
 * - Salário atual do jogador + 15%
 * - Média dos 10 maiores salários da posição na liga
 *
 * @param player - Jogador a ser tagueado
 * @param playerContract - Contrato atual do jogador
 * @param allContracts - Todos os contratos ativos da liga
 * @param currentSeason - Temporada atual
 * @returns Cálculo detalhado da franchise tag
 */
export function calculateFranchiseTagValue(
  player: Player,
  playerContract: Contract,
  allContracts: Contract[],
  currentSeason: number,
): FranchiseTagCalculation {
  // Calcula salário atual + 15%
  const yearsFromSigning = currentSeason - playerContract.signedSeason;
  const currentSalary = calculateAnnualSalary(playerContract, yearsFromSigning);
  const salaryWith15Percent = currentSalary * 1.15;

  // Filtra contratos ativos da mesma posição
  // Em implementação real, seria necessário fazer join com tabela de jogadores
  // para calcular a média dos top 10 da posição

  // Para este exemplo, vamos usar um valor mock para a média da posição
  // Em implementação real, seria calculado dinamicamente
  const positionAverages: Record<PlayerPosition, number> = {
    [PlayerPosition.QB]: 25.0,
    [PlayerPosition.RB]: 12.0,
    [PlayerPosition.WR]: 15.0,
    [PlayerPosition.TE]: 8.0,
    [PlayerPosition.K]: 3.0,
    [PlayerPosition.DL]: 10.0,
    [PlayerPosition.LB]: 8.0,
    [PlayerPosition.DB]: 9.0,
  };

  const positionTop10Average = positionAverages[player.position] || 5.0;

  // Valor final é o maior entre os dois
  const finalTagValue = Math.max(salaryWith15Percent, positionTop10Average);

  return {
    position: player.position,
    currentSalary,
    salaryWith15Percent: Math.round(salaryWith15Percent * 100) / 100,
    positionTop10Average,
    finalTagValue: Math.round(finalTagValue * 100) / 100,
    canApplyTag: true,
  };
}

/**
 * Cria um novo contrato para um jogador
 *
 * @param playerId - ID do jogador
 * @param teamId - ID do time
 * @param leagueId - ID da liga
 * @param salary - Salário inicial em milhões
 * @param years - Duração do contrato em anos
 * @param acquisitionType - Tipo de aquisição
 * @param season - Temporada de assinatura
 * @returns Novo contrato criado
 */
export function createContract(
  playerId: string,
  teamId: string,
  leagueId: string,
  salary: number,
  years: number,
  acquisitionType: AcquisitionType,
  season: number,
): Omit<Contract, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    playerId,
    teamId,
    leagueId,
    currentSalary: salary,
    originalSalary: salary,
    yearsRemaining: years,
    originalYears: years,
    status: ContractStatus.ACTIVE,
    acquisitionType,
    signedSeason: season,
    hasBeenTagged: false,
    hasBeenExtended: false,
    hasFourthYearOption: false,
    fourthYearOptionActivated: false,
  };
}

/**
 * Atualiza um contrato para a nova temporada
 *
 * Aplica aumento anual de 15% e reduz anos restantes
 *
 * @param contract - Contrato a ser atualizado
 * @param newSeason - Nova temporada
 * @returns Contrato atualizado
 */
export function updateContractForNewSeason(
  contract: Contract,
  newSeason: number,
): Partial<Contract> {
  const yearsFromSigning = newSeason - contract.signedSeason;
  const newSalary = calculateAnnualSalary(contract, yearsFromSigning);
  const newYearsRemaining = Math.max(0, contract.yearsRemaining - 1);

  return {
    currentSalary: newSalary,
    yearsRemaining: newYearsRemaining,
    status: newYearsRemaining === 0 ? ContractStatus.EXPIRED : contract.status,
  };
}

/**
 * Projeta o salary cap de um time para os próximos anos
 *
 * @param team - Time para projeção
 * @param contracts - Contratos ativos do time
 * @param years - Número de anos para projetar
 * @param leagueCap - Teto salarial da liga
 * @returns Projeções anuais do cap
 */
export function projectTeamCap(
  team: Team,
  contracts: Contract[],
  years: number,
  leagueCap: number,
): CapProjection[] {
  const projections: CapProjection[] = [];
  const currentSeason = new Date().getFullYear();

  for (let i = 0; i < years; i++) {
    const projectionYear = currentSeason + i;
    let committedSalaries = 0;
    let expiringContracts = 0;

    // Calcula salários comprometidos para este ano
    contracts.forEach(contract => {
      const yearsFromSigning = projectionYear - contract.signedSeason;
      const contractYearsRemaining = contract.originalYears - yearsFromSigning;

      if (contractYearsRemaining > 0) {
        const yearSalary = calculateAnnualSalary(contract, yearsFromSigning);
        committedSalaries += yearSalary;

        if (contractYearsRemaining === 1) {
          expiringContracts++;
        }
      }
    });

    // Dead money (simplificado - seria calculado baseado em cortes)
    const deadMoney = i === 0 ? team.currentDeadMoney : team.nextSeasonDeadMoney;

    const availableCap = leagueCap - committedSalaries - deadMoney;

    projections.push({
      year: projectionYear,
      committedSalaries: Math.round(committedSalaries * 100) / 100,
      deadMoney: Math.round(deadMoney * 100) / 100,
      availableCap: Math.round(availableCap * 100) / 100,
      expiringContracts,
    });
  }

  return projections;
}

/**
 * Valida se um time tem cap suficiente para uma operação
 *
 * @param team - Time que fará a operação
 * @param operationCost - Custo da operação em milhões
 * @returns Se tem cap suficiente e detalhes
 */
export function validateCapSpace(
  team: Team,
  operationCost: number,
): { hasSpace: boolean; availableCap: number; shortfall?: number } {
  const hasSpace = team.availableCap >= operationCost;
  const shortfall = hasSpace ? undefined : operationCost - team.availableCap;

  return {
    hasSpace,
    availableCap: team.availableCap,
    shortfall,
  };
}

// ============================================================================
// FUNÇÕES DE TESTE E EXEMPLOS
// ============================================================================

/**
 * Executa testes básicos das funções implementadas
 * Pode ser chamada para verificar se tudo está funcionando
 */
export function runBasicTests(): void {
  console.log('🧪 Executando testes básicos das funções de contrato...');

  // Mock de contrato para testes
  const mockContract: Contract = {
    id: 'test-1',
    playerId: 'player-1',
    teamId: 'team-1',
    leagueId: 'league-1',
    currentSalary: 10.0,
    originalSalary: 10.0,
    yearsRemaining: 3,
    originalYears: 4,
    status: ContractStatus.ACTIVE,
    acquisitionType: AcquisitionType.AUCTION,
    signedSeason: 2024,
    hasBeenTagged: false,
    hasBeenExtended: false,
    hasFourthYearOption: false,
    fourthYearOptionActivated: false,
    createdAt: toISOString(),
    updatedAt: toISOString(),
  };

  // Teste 1: Cálculo de salário anual
  console.log('\n📊 Teste 1: Cálculo de salário anual');
  console.log(`Salário original: $${mockContract.originalSalary}M`);
  console.log(`Ano 0: $${calculateAnnualSalary(mockContract, 0)}M`);
  console.log(`Ano 1: $${calculateAnnualSalary(mockContract, 1)}M`);
  console.log(`Ano 2: $${calculateAnnualSalary(mockContract, 2)}M`);
  console.log(`Ano 3: $${calculateAnnualSalary(mockContract, 3)}M`);

  // Teste 2: Cálculo de dead money
  console.log('\n💀 Teste 2: Cálculo de dead money');
  const deadMoney = calculateDeadMoney(mockContract, 1, false);
  console.log(`Cortado no ano 1:`);
  console.log(`- Total: $${deadMoney.totalAmount}M`);
  console.log(`- Temporada atual: $${deadMoney.currentSeasonAmount}M`);
  console.log(`- Próxima temporada: $${deadMoney.nextSeasonAmount}M`);

  // Teste 3: Validação de extensão
  console.log('\n📝 Teste 3: Validação de extensão');
  const canExtend1 = canExtendContract(mockContract);
  console.log(`Pode estender (3 anos restantes): ${canExtend1.canExtend}`);
  console.log(`Motivo: ${canExtend1.reason || 'N/A'}`);

  const lastYearContract = { ...mockContract, yearsRemaining: 1 };
  const canExtend2 = canExtendContract(lastYearContract);
  console.log(`Pode estender (1 ano restante): ${canExtend2.canExtend}`);

  // Teste 4: Validação de franchise tag
  console.log('\n🏷️ Teste 4: Validação de franchise tag');
  const canTag = canApplyFranchiseTag(lastYearContract, 0, 1);
  console.log(`Pode aplicar tag: ${canTag.canTag}`);

  // Teste 5: Projeção de cap
  console.log('\n💰 Teste 5: Projeção de salary cap');
  const mockTeam: Team = {
    id: 'team-1',
    leagueId: 'league-1',
    ownerId: 'owner-1',
    name: 'Test Team',
    abbreviation: 'TST',
    availableCap: 50.0,
    currentDeadMoney: 5.0,
    nextSeasonDeadMoney: 2.0,
    franchiseTagsUsed: 0,
    createdAt: toISOString(),
    updatedAt: toISOString(),
  };

  const projections = projectTeamCap(mockTeam, [mockContract], 3, 279.0);
  projections.forEach(proj => {
    console.log(
      `Ano ${proj.year}: Cap disponível $${proj.availableCap}M, Contratos expirando: ${proj.expiringContracts}`,
    );
  });

  console.log('\n✅ Testes básicos concluídos!');
}

// Executa os testes se o arquivo for executado diretamente
if (typeof window === 'undefined' && require.main === module) {
  runBasicTests();
}

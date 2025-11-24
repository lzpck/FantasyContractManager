/**
 * Tipos e interfaces principais do sistema de gerenciamento de contratos
 * para ligas de fantasy football
 *
 * Baseado nas regras da liga "The Bad Place" e requisitos do projeto
 */

// ============================================================================
// ENUMS E TIPOS AUXILIARES
// ============================================================================

/**
 * Status possíveis de um contrato
 */
export enum ContractStatus {
  /** Contrato ativo e válido */
  ACTIVE = 'ACTIVE',
  /** Contrato expirado (último ano concluído) */
  EXPIRED = 'EXPIRED',
  /** Jogador com Franchise Tag aplicada */
  TAGGED = 'TAGGED',
  /** Contrato estendido (extensão negociada) */
  EXTENDED = 'EXTENDED',
  /** Jogador cortado (contrato rescindido) */
  CUT = 'CUT',
}

/**
 * Posições dos jogadores no fantasy football
 */
export enum PlayerPosition {
  QB = 'QB',
  RB = 'RB',
  WR = 'WR',
  TE = 'TE',
  K = 'K',
  DL = 'DL',
  LB = 'LB',
  DB = 'DB',
}

/**
 * Status do jogador no roster
 */
export type PlayerRosterStatus = 'active' | 'ir' | 'taxi' | 'cut';

/**
 * Configuração de Dead Money por Liga
 */
export interface DeadMoneyConfig {
  /** Percentual aplicado ao salário do ano atual (ex: 1.0 = 100%) */
  currentSeason: number;
  /** Percentuais aplicados conforme anos restantes de contrato */
  futureSeasons: {
    /** Percentual para 1 ano restante */
    '1': number;
    /** Percentual para 2 anos restantes */
    '2': number;
    /** Percentual para 3 anos restantes */
    '3': number;
    /** Percentual para 4 anos restantes */
    '4': number;
  };
}

/**
 * Configuração padrão de Dead Money
 */
export const DEFAULT_DEAD_MONEY_CONFIG: DeadMoneyConfig = {
  currentSeason: 1.0, // 100% do salário atual
  futureSeasons: {
    '1': 0, // 0% para 1 ano restante
    '2': 0.5, // 50% para 2 anos restantes
    '3': 0.75, // 75% para 3 anos restantes
    '4': 1.0, // 100% para 4 anos restantes
  },
};

/**
 * Tipos de aquisição de jogadores
 */
export enum AcquisitionType {
  /** Leilão inicial da liga */
  AUCTION = 'auction',
  /** Free Agency/Waivers (FAAB) */
  FAAB = 'faab',
  /** Rookie Draft */
  ROOKIE_DRAFT = 'rookie_draft',
  /** Trade entre times */
  TRADE = 'trade',
  /** Jogador não disputado (contrato mínimo) */
  UNDISPUTED = 'undisputed',
}

/**
 * Status da liga
 */
export enum LeagueStatus {
  /** Liga ativa na temporada atual */
  ACTIVE = 'active',
  /** Liga em off-season */
  OFFSEASON = 'offseason',
  /** Liga arquivada/inativa */
  ARCHIVED = 'archived',
}

/**
 * Tipos de movimentação no salary cap
 */
export enum CapMovementType {
  /** Contratação de jogador */
  SIGNING = 'signing',
  /** Corte de jogador */
  RELEASE = 'release',
  /** Trade recebido */
  TRADE_IN = 'trade_in',
  /** Trade enviado */
  TRADE_OUT = 'trade_out',
  /** Aumento anual automático (15%) */
  ANNUAL_INCREASE = 'annual_increase',
  /** Franchise Tag aplicada */
  FRANCHISE_TAG = 'franchise_tag',
  /** Extensão de contrato */
  CONTRACT_EXTENSION = 'contract_extension',
  /** Dead money por corte */
  DEAD_MONEY = 'dead_money',
}

// ============================================================================
// INTERFACES PRINCIPAIS
// ============================================================================

/**
 * Tipos de perfil de usuário
 */
export enum UserRole {
  /** Comissário - gerencia ligas */
  COMMISSIONER = 'COMMISSIONER',
  /** Usuário - gerencia seus times */
  USER = 'USER',
}

/**
 * Informações básicas de um usuário/proprietário de time
 */
export interface User {
  /** ID único do usuário */
  id: string;
  /** Nome completo do usuário */
  name: string;
  /** Email do usuário */
  email: string;
  /** URL do avatar (opcional) */
  avatar?: string;
  /** Perfil/role do usuário */
  role: UserRole;
  /** Se o usuário está ativo */
  isActive: boolean;
  /** Data de criação da conta */
  createdAt: string; // ISO 8601 format
  /** Data da última atualização */
  updatedAt: string; // ISO 8601 format
}

/**
 * Configurações e informações de uma liga
 */
export interface League {
  /** ID único da liga */
  id: string;
  /** Nome da liga */
  name: string;
  /** Temporada atual (ano) */
  season: number;
  /** Teto salarial da liga em milhões */
  salaryCap: number;
  /** Número total de times na liga */
  totalTeams: number;
  /** Status atual da liga */
  status: LeagueStatus;
  /** ID da liga no Sleeper (integração) */
  sleeperLeagueId?: string;
  /** ID do comissário da liga */
  commissionerId: string;
  /** Dados do comissário (quando carregado) */
  commissioner?: User;

  /** Número máximo de Franchise Tags por temporada */
  maxFranchiseTags: number;
  /** Percentual de aumento anual dos contratos */
  annualIncreasePercentage: number;
  /** Valor mínimo para contratos não disputados */
  minimumSalary: number;
  /** Data de virada da temporada */
  seasonTurnoverDate: string;
  /** Configuração de dead money da liga (JSON string) */
  deadMoneyConfig?: string;
  /** Configurações específicas da liga */
  settings: LeagueSettings;
  /** Times da liga */
  teams?: Team[];
  /** Data de criação da liga */
  createdAt: string; // ISO 8601 format
  /** Data da última atualização */
  updatedAt: string; // ISO 8601 format
}

/**
 * Dados do formulário de criação/edição de liga
 */
export interface LeagueFormData {
  /** Nome da liga */
  name: string;
  /** ID da liga no Sleeper (opcional para edição) */
  sleeperLeagueId: string;
  /** Teto salarial da liga */
  salaryCap: number;
  /** Número máximo de Franchise Tags por temporada */
  maxFranchiseTags: number;
  /** Percentual de aumento anual dos contratos */
  annualIncreasePercentage: number;
  /** Valor mínimo para contratos não disputados */
  minimumSalary: number;
  /** Data de virada da temporada */
  seasonTurnoverDate: string;
  /** Configuração de dead money da liga */
  deadMoneyConfig: DeadMoneyConfig;
}

/**
 * Configurações específicas de uma liga
 */
export interface LeagueSettings {
  /** Número máximo de Franchise Tags por temporada */
  maxFranchiseTags: number;
  /** Percentual de aumento anual dos contratos (padrão: 15%) */
  annualIncreasePercentage: number;
  /** Valor mínimo para contratos não disputados */
  minimumSalary: number;
  /** Data de virada da temporada (padrão: 1º de abril) */
  seasonTurnoverDate: string;
  /** Configurações do Rookie Draft */
  rookieDraft: RookieDraftSettings;
}

/**
 * Configurações do Rookie Draft
 */
export interface RookieDraftSettings {
  /** Número de rodadas do draft */
  rounds: number;
  /** Se picks do 1º round têm opção de 4º ano */
  firstRoundFourthYearOption: boolean;
  /** Tabela de salários dos rookies por pick */
  salaryTable: RookieSalaryTable[];
}

/**
 * Tabela de salários para picks do rookie draft
 */
export interface RookieSalaryTable {
  /** Número do pick (1, 2, 3...) */
  pick: number;
  /** Rodada do pick */
  round: number;
  /** Salário em milhões para o 1º ano */
  firstYearSalary: number;
  /** Salário em milhões para o 2º ano */
  secondYearSalary: number;
  /** Salário em milhões para o 3º ano */
  thirdYearSalary: number;
  /** Salário em milhões para o 4º ano (se aplicável) */
  fourthYearSalary?: number;
}

/**
 * Informações de um time na liga
 */
export interface Team {
  /** ID único do time */
  id: string;
  /** ID da liga à qual pertence */
  leagueId: string;
  /** ID do proprietário (usuário) */
  ownerId: string;
  /** ID do usuário no Sleeper */
  sleeperOwnerId?: string;
  /** Nome de exibição do usuário no Sleeper */
  ownerDisplayName?: string;
  /** Nome do time */
  name: string;
  /** Abreviação do time (3-4 letras) */
  abbreviation: string;
  /** URL do logo do time */
  logo?: string;
  /** ID do time no Sleeper (integração) */
  sleeperTeamId?: string;
  /** Salary cap atual disponível */
  availableCap: number;
  /** Total de dead money na temporada atual */
  currentDeadMoney: number;
  /** Total de dead money na próxima temporada */
  nextSeasonDeadMoney: number;
  /** Número de Franchise Tags usadas na temporada */
  franchiseTagsUsed: number;
  /** Data de criação do time */
  createdAt: string; // ISO 8601 format
  /** Data da última atualização */
  updatedAt: string; // ISO 8601 format
}

/**
 * Team com informações da liga incluídas (para casos onde a relação é carregada)
 */
export interface TeamWithLeague extends Team {
  /** Informações da liga */
  league?: {
    id: string;
    name: string;
    season: number;
  };
}

/**
 * Contract com informações do jogador incluídas (para casos onde a relação é carregada)
 */
export interface ContractWithPlayer extends Contract {
  /** Informações do jogador */
  player: Player;
  /** Informações do time (opcional) */
  team?: {
    id: string;
    name: string;
    league?: {
      id: string;
      name: string;
      season: number;
    };
  };
}

/**
 * Informações de um jogador
 */
export interface Player {
  /** ID único do jogador */
  id: string;
  /** ID do jogador no Sleeper */
  sleeperPlayerId: string;
  /** Nome completo do jogador */
  name: string;
  /** Posição do jogador */
  position: PlayerPosition;
  /** Posições elegíveis no fantasy */
  fantasyPositions: PlayerPosition[];
  /** Time da NFL */
  nflTeam: string;
  /** Número da camisa */
  jerseyNumber?: number;
  /** Ano de entrada na NFL (para rookies) */
  rookieYear?: number;
  /** Se o jogador está ativo na NFL */
  isActive: boolean;
  /** Data de criação do registro */
  createdAt: string; // ISO 8601 format
  /** Data da última atualização */
  updatedAt: string; // ISO 8601 format
}

/**
 * Contrato de um jogador com um time
 */
export interface Contract {
  /** ID único do contrato */
  id: string;
  /** ID do jogador */
  playerId: string;
  /** ID do time */
  teamId: string;
  /** ID da liga */
  leagueId: string;
  /** Salário atual em milhões */
  currentSalary: number;
  /** Salário original (quando foi contratado) */
  originalSalary: number;
  /** Anos restantes no contrato */
  yearsRemaining: number;
  /** Anos totais do contrato original */
  originalYears: number;
  /** Status atual do contrato */
  status: ContractStatus;
  /** Tipo de aquisição do jogador */
  acquisitionType: AcquisitionType;
  /** Temporada em que o contrato foi assinado */
  signedSeason: number;
  /** Se o jogador já foi tagueado antes */
  hasBeenTagged: boolean;
  /** Se o jogador já recebeu extensão antes */
  hasBeenExtended: boolean;
  /** Se é um contrato de rookie com opção de 4º ano */
  hasFourthYearOption: boolean;
  /** Se a opção de 4º ano foi ativada */
  fourthYearOptionActivated: boolean;
  /** Data de criação do contrato */
  createdAt: string; // ISO 8601 format
  /** Data da última atualização */
  updatedAt: string; // ISO 8601 format
}

/**
 * Franchise Tag aplicada a um jogador
 */
export interface FranchiseTag {
  /** ID único da tag */
  id: string;
  /** ID do contrato relacionado */
  contractId: string;
  /** ID do jogador */
  playerId: string;
  /** ID do time */
  teamId: string;
  /** Temporada em que a tag foi aplicada */
  season: number;
  /** Valor da tag em milhões */
  tagValue: number;
  /** Salário anterior do jogador */
  previousSalary: number;
  /** Média dos top 10 da posição (usado no cálculo) */
  positionAverage: number;
  /** Data de aplicação da tag */
  appliedAt: string; // ISO 8601 format
}

/**
 * Extensão de contrato negociada
 */
export interface ContractExtension {
  /** ID único da extensão */
  id: string;
  /** ID do contrato original */
  originalContractId: string;
  /** ID do jogador */
  playerId: string;
  /** ID do time */
  teamId: string;
  /** Novo salário negociado */
  newSalary: number;
  /** Novos anos adicionados */
  newYears: number;
  /** Temporada em que a extensão foi negociada */
  negotiatedSeason: number;
  /** Temporada em que a extensão entra em vigor */
  effectiveSeason: number;
  /** Data da negociação */
  negotiatedAt: string; // ISO 8601 format
}

/**
 * Registro de dead money por jogador cortado
 */
export interface DeadMoney {
  /** ID único do registro */
  id: string;
  /** ID do contrato que gerou o dead money */
  contractId: string;
  /** ID do jogador */
  playerId: string;
  /** ID do time */
  teamId: string;
  /** Valor total do dead money */
  totalAmount: number;
  /** Valor que afeta a temporada atual */
  currentSeasonAmount: number;
  /** Valor que afeta a próxima temporada */
  nextSeasonAmount: number;
  /** Temporada em que o jogador foi cortado */
  cutSeason: number;
  /** Se o jogador estava no practice squad */
  wasPracticeSquad: boolean;
  /** Data em que o jogador foi cortado */
  cutAt: string; // ISO 8601 format
}

/**
 * Movimentação no salary cap de um time
 */
export interface CapMovement {
  /** ID único da movimentação */
  id: string;
  /** ID do time */
  teamId: string;
  /** ID do jogador (se aplicável) */
  playerId?: string;
  /** Tipo da movimentação */
  type: CapMovementType;
  /** Valor da movimentação (positivo = gasto, negativo = economia) */
  amount: number;
  /** Descrição da movimentação */
  description: string;
  /** Temporada da movimentação */
  season: number;
  /** Data da movimentação */
  createdAt: string; // ISO 8601 format
}

/**
 * Pick do rookie draft
 */
export interface DraftPick {
  /** ID único do pick */
  id: string;
  /** ID da liga */
  leagueId: string;
  /** ID do time original */
  originalTeamId: string;
  /** ID do time atual (pode ser diferente por trades) */
  currentTeamId: string;
  /** Temporada do draft */
  season: number;
  /** Rodada do pick */
  round: number;
  /** Posição na rodada */
  pick: number;
  /** Posição geral no draft */
  overallPick: number;
  /** ID do jogador selecionado (se já foi usado) */
  selectedPlayerId?: string;
  /** Se o pick já foi usado */
  isUsed: boolean;
  /** Data de criação */
  createdAt: string; // ISO 8601 format
}

// ============================================================================
// TIPOS COMPOSTOS E UTILITÁRIOS
// ============================================================================

/**
 * Dados completos de um jogador com seu contrato
 */
export interface PlayerWithContract {
  player: Player;
  contract: Contract | null;
  franchiseTag?: FranchiseTag;
  extension?: ContractExtension;
  deadMoney?: DeadMoney;
  rosterStatus?: PlayerRosterStatus;
}

/**
 * Resumo financeiro de um time
 */
export interface TeamFinancialSummary {
  team: Team;
  totalSalaries: number;
  availableCap: number;
  currentDeadMoney: number;
  nextSeasonDeadMoney: number;
  projectedNextSeasonCap: number;
  contractsExpiring: number;
  playersWithContracts: PlayerWithContract[];
}

/**
 * Dados para cálculo de Franchise Tag
 */
export interface FranchiseTagCalculation {
  position: PlayerPosition;
  currentSalary: number;
  salaryWith15Percent: number;
  positionTop10Average: number;
  finalTagValue: number;
  canApplyTag: boolean;
  reason?: string;
}

/**
 * Configurações de uma temporada
 */
export interface SeasonConfig {
  season: number;
  salaryCap: number;
  seasonStartDate: string; // ISO 8601 format
  seasonEndDate: string; // ISO 8601 format
  franchiseTagDeadline: string; // ISO 8601 format
  rookieDraftDate?: string; // ISO 8601 format
}

/**
 * Dados de integração com Sleeper API
 */
export interface SleeperIntegration {
  leagueId: string;
  season: number;
  lastSync: string; // ISO 8601 format
  rosters: SleeperRoster[];
  players: SleeperPlayer[];
}

export interface SleeperRoster {
  rosterId: number;
  ownerId: string;
  /** Jogadores ativos do roster */
  players: string[];
  /** Jogadores na lista de machucados/reserva */
  reserve?: string[];
  /** Jogadores no taxi squad */
  taxi?: string[];
}

/** Roster transformado para uso interno */
export interface TeamRoster {
  /** ID do roster na Sleeper */
  sleeperRosterId: number;
  /** ID do proprietário (Sleeper user) */
  ownerId: string;
  /** Lista de jogadores ativos */
  players: string[];
  /** Lista de reservas */
  reserve: string[];
  /** Lista de jogadores no taxi squad */
  taxi: string[];
}

export interface SleeperPlayer {
  playerId: string;
  firstName: string;
  lastName: string;
  position: string;
  team: string;
  active: boolean;
}

// ============================================================================
// TIPOS PARA FORMULÁRIOS E VALIDAÇÃO
// ============================================================================

/**
 * Dados para criação de nova liga
 */
export interface CreateLeagueData {
  name: string;
  season: number;
  salaryCap: number;
  totalTeams: number;
  sleeperLeagueId?: string;
  settings: Partial<LeagueSettings>;
}

/**
 * Dados para criação de novo time
 */
export interface CreateTeamData {
  name: string;
  abbreviation: string;
  ownerId: string;
  logo?: string;
}

/**
 * Dados para assinatura de contrato
 */
export interface SignContractData {
  playerId: string;
  teamId: string;
  salary: number;
  years: number;
  acquisitionType: AcquisitionType;
}

/**
 * Dados para aplicação de Franchise Tag
 */
export interface ApplyFranchiseTagData {
  contractId: string;
  season: number;
}

/**
 * Dados para extensão de contrato
 */
export interface ExtendContractData {
  contractId: string;
  newSalary: number;
  newYears: number;
  effectiveSeason: number;
}

/**
 * Interface para dados de classificação de um time
 */
export interface TeamStanding {
  /** Posição na classificação */
  position: number;
  /** Dados do time */
  team: Team;
  /** Dados financeiros do time */
  financialSummary: TeamFinancialSummary;
  /** Número de vitórias */
  wins: number;
  /** Número de derrotas */
  losses: number;
  /** Número de empates */
  ties: number;
  /** Pontos feitos (PF) */
  pointsFor: number;
  /** Pontos contra (PA) */
  pointsAgainst: number;
  /** Sequência atual (W/L) */
  streak: string;
  /** Porcentagem de vitórias (PCT) */
  pct: number;
  /** Se está na zona de playoffs (baseado no número de times de playoffs da liga) */
  isPlayoffTeam: boolean;
  /** Dados do Sleeper roster */
  sleeperData?: {
    rosterId: number;
    ownerId: string;
    settings: {
      wins: number;
      losses: number;
      ties: number;
      fpts: number;
      fpts_decimal: number;
      fpts_against: number;
      fpts_against_decimal: number;
    };
    metadata?: {
      streak?: string;
      record?: string;
    };
  };
}

/**
 * Opções de ordenação para a classificação
 */
export type StandingsSortBy =
  | 'position'
  | 'name'
  | 'wins'
  | 'losses'
  | 'pct'
  | 'pointsFor'
  | 'pointsAgainst'
  | 'availableCap'
  | 'totalSalaries';

// ============================================================================
// TIPOS PARA EVENTOS
// ============================================================================

/**
 * Status de um evento baseado nas datas
 */
export enum EventStatus {
  /** Evento ainda não iniciado */
  UPCOMING = 'upcoming',
  /** Evento em andamento */
  ONGOING = 'ongoing',
  /** Evento finalizado */
  COMPLETED = 'completed',
}

/**
 * Interface para um evento da liga
 */
export interface Event {
  /** ID único do evento */
  id: string;
  /** ID da liga à qual o evento pertence */
  leagueId: string;
  /** Nome do evento */
  name: string;
  /** Descrição detalhada do evento (opcional) */
  description?: string;
  /** Data e hora de início do evento */
  startDate: string; // ISO 8601 format
  /** Data e hora de fim do evento (opcional) */
  endDate?: string; // ISO 8601 format
  /** ID do usuário que criou o evento */
  createdBy: string;
  /** Data de criação do evento */
  createdAt: string; // ISO 8601 format
  /** Data da última atualização */
  updatedAt: string; // ISO 8601 format
  /** Dados do criador do evento */
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  /** Status calculado do evento */
  status?: EventStatus;
}

/**
 * Dados para criação de um novo evento
 */
export interface CreateEventData {
  /** Nome do evento */
  name: string;
  /** Descrição do evento (opcional) */
  description?: string;
  /** Data e hora de início */
  startDate: string;
  /** Data e hora de fim (opcional) */
  endDate?: string;
}

/**
 * Dados para atualização de um evento
 */
export interface UpdateEventData {
  /** Nome do evento */
  name: string;
  /** Descrição do evento (opcional) */
  description?: string;
  /** Data e hora de início */
  startDate: string;
  /** Data e hora de fim (opcional) */
  endDate?: string;
}

const types = {
  ContractStatus,
  PlayerPosition,
  AcquisitionType,
  LeagueStatus,
  CapMovementType,
  EventStatus,
};

export default types;

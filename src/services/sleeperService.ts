/**
 * Serviço de integração com a Sleeper API
 *
 * Este serviço é responsável por:
 * - Buscar dados de ligas, rosters e jogadores da Sleeper API
 * - Transformar dados da Sleeper para o modelo local
 * - Mapear estruturas de dados entre as duas plataformas
 * - Sincronizar dados de ligas existentes
 */

import { League, Team, Player, LeagueSettings, PlayerPosition, TeamRoster } from '@/types';
import { LeagueStatus } from '@/types/database';

// ============================================================================
// TIPOS DA SLEEPER API
// ============================================================================

/**
 * Estrutura de dados de uma liga retornada pela Sleeper API
 */
export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  status: string;
  sport: string;
  /** Quantidade de times na liga */
  num_teams?: number;
  settings: {
    max_keepers?: number;
    trade_deadline?: number;
    playoff_week_start?: number;
    num_teams: number;
    playoff_teams?: number;
    playoff_type?: number;
    daily_waivers?: number;
    waiver_type?: number;
    bench_lock?: number;
    reserve_allow_cov?: number;
    reserve_slots?: number;
    taxi_allow_vets?: number;
    taxi_slots?: number;
    taxi_years?: number;
    league_average_match?: number;
    leg?: number;
    draft_rounds?: number;
    salary_cap?: number;
  };
  total_rosters: number;
  roster_positions: string[];
  scoring_settings: Record<string, number>;
  metadata?: {
    auto_continue?: string;
    keeper_deadline?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

/**
 * Estrutura de dados de um roster retornado pela Sleeper API
 */
export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  players: string[];
  starters: string[];
  reserve?: string[];
  taxi?: string[];
  settings: {
    wins: number;
    waiver_position: number;
    waiver_budget_used: number;
    total_moves: number;
    ties: number;
    losses: number;
    fpts: number;
    fpts_decimal: number;
    fpts_against: number;
    fpts_against_decimal: number;
  };
  metadata?: {
    streak?: string;
    record?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

/**
 * Estrutura de dados de um jogador retornado pela Sleeper API
 */
export interface SleeperPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  team: string;
  age?: number;
  height?: string;
  weight?: string;
  years_exp?: number;
  college?: string;
  status?: string;
  injury_status?: string;
  fantasy_positions?: string[];
  number?: number;
  depth_chart_position?: number;
  depth_chart_order?: number;
  search_rank?: number;
  search_full_name?: string;
  search_first_name?: string;
  search_last_name?: string;
}

/**
 * Estrutura de dados de um usuário retornado pela Sleeper API
 */
export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar?: string;
  metadata?: {
    team_name?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

// ============================================================================
// CONFIGURAÇÕES DA API
// ============================================================================

const SLEEPER_API_BASE = 'https://api.sleeper.app/v1';

// ============================================================================
// FUNÇÕES DE BUSCA NA SLEEPER API
// ============================================================================

/**
 * Busca dados de uma liga específica na Sleeper API
 */
export async function fetchSleeperLeague(leagueId: string): Promise<SleeperLeague> {
  const response = await fetch(`${SLEEPER_API_BASE}/league/${leagueId}`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar liga: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

/**
 * Busca informações de uma liga específica do Sleeper
 */
export async function getSleeperLeague(leagueId: string): Promise<SleeperLeague | null> {
  try {
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`);

    if (!response.ok) {
      console.error('Erro ao buscar liga do Sleeper:', response.status);
      return null;
    }

    const league: SleeperLeague = await response.json();
    return league;
  } catch (error) {
    console.error('Erro ao buscar liga do Sleeper:', error);
    return null;
  }
}

/**
 * Busca o status de uma liga específica do Sleeper
 */
export async function getSleeperLeagueStatus(leagueId: string): Promise<string | null> {
  try {
    const league = await getSleeperLeague(leagueId);
    return league?.status || null;
  } catch (error) {
    console.error('Erro ao buscar status da liga do Sleeper:', error);
    return null;
  }
}

/**
 * Busca rosters de uma liga específica na Sleeper API
 */
export async function fetchSleeperRosters(leagueId: string): Promise<SleeperRoster[]> {
  const response = await fetch(`${SLEEPER_API_BASE}/league/${leagueId}/rosters`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar rosters: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

/**
 * Busca dados de usuários de uma liga específica na Sleeper API
 */
export async function fetchSleeperUsers(leagueId: string): Promise<SleeperUser[]> {
  const response = await fetch(`${SLEEPER_API_BASE}/league/${leagueId}/users`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar usuários: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

/**
 * Busca dados de todos os jogadores da NFL na Sleeper API
 */
export async function fetchSleeperPlayers(): Promise<Record<string, SleeperPlayer>> {
  const response = await fetch(`${SLEEPER_API_BASE}/players/nfl`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar jogadores: ${response.status} - ${response.statusText}`);
  }

  const players = await response.json();

  return players;
}

// ============================================================================
// FUNÇÕES DE TRANSFORMAÇÃO DE DADOS
// ============================================================================

/**
 * Transforma dados de uma liga da Sleeper para o modelo local
 */
export function transformSleeperLeagueToLocal(
  sleeperLeague: SleeperLeague,
  commissionerId: string,
): Omit<League, 'id' | 'createdAt' | 'updatedAt' | 'teams'> {
  // Configurações padrão baseadas nas regras da liga
  const defaultSettings: LeagueSettings = {
    maxFranchiseTags: 1,
    annualIncreasePercentage: 15.0,
    minimumSalary: 1000000,
    seasonTurnoverDate: '04-01',
    rookieDraft: {
      rounds: 3,
      firstRoundFourthYearOption: true,
      salaryTable: [
        // Round 1 picks
        {
          pick: 1,
          round: 1,
          firstYearSalary: 8.0,
          secondYearSalary: 8.5,
          thirdYearSalary: 9.0,
          fourthYearSalary: 9.5,
        },
        {
          pick: 2,
          round: 1,
          firstYearSalary: 7.5,
          secondYearSalary: 8.0,
          thirdYearSalary: 8.5,
          fourthYearSalary: 9.0,
        },
        {
          pick: 3,
          round: 1,
          firstYearSalary: 7.0,
          secondYearSalary: 7.5,
          thirdYearSalary: 8.0,
          fourthYearSalary: 8.5,
        },
        {
          pick: 4,
          round: 1,
          firstYearSalary: 6.5,
          secondYearSalary: 7.0,
          thirdYearSalary: 7.5,
          fourthYearSalary: 8.0,
        },
        {
          pick: 5,
          round: 1,
          firstYearSalary: 6.0,
          secondYearSalary: 6.5,
          thirdYearSalary: 7.0,
          fourthYearSalary: 7.5,
        },
        {
          pick: 6,
          round: 1,
          firstYearSalary: 5.5,
          secondYearSalary: 6.0,
          thirdYearSalary: 6.5,
          fourthYearSalary: 7.0,
        },
        {
          pick: 7,
          round: 1,
          firstYearSalary: 5.0,
          secondYearSalary: 5.5,
          thirdYearSalary: 6.0,
          fourthYearSalary: 6.5,
        },
        {
          pick: 8,
          round: 1,
          firstYearSalary: 4.5,
          secondYearSalary: 5.0,
          thirdYearSalary: 5.5,
          fourthYearSalary: 6.0,
        },
        {
          pick: 9,
          round: 1,
          firstYearSalary: 4.0,
          secondYearSalary: 4.5,
          thirdYearSalary: 5.0,
          fourthYearSalary: 5.5,
        },
        {
          pick: 10,
          round: 1,
          firstYearSalary: 3.5,
          secondYearSalary: 4.0,
          thirdYearSalary: 4.5,
          fourthYearSalary: 5.0,
        },
        {
          pick: 11,
          round: 1,
          firstYearSalary: 3.0,
          secondYearSalary: 3.5,
          thirdYearSalary: 4.0,
          fourthYearSalary: 4.5,
        },
        {
          pick: 12,
          round: 1,
          firstYearSalary: 2.5,
          secondYearSalary: 3.0,
          thirdYearSalary: 3.5,
          fourthYearSalary: 4.0,
        },
        // Round 2 picks
        { pick: 13, round: 2, firstYearSalary: 2.0, secondYearSalary: 2.2, thirdYearSalary: 2.4 },
        { pick: 14, round: 2, firstYearSalary: 1.9, secondYearSalary: 2.1, thirdYearSalary: 2.3 },
        { pick: 15, round: 2, firstYearSalary: 1.8, secondYearSalary: 2.0, thirdYearSalary: 2.2 },
        { pick: 16, round: 2, firstYearSalary: 1.7, secondYearSalary: 1.9, thirdYearSalary: 2.1 },
        { pick: 17, round: 2, firstYearSalary: 1.6, secondYearSalary: 1.8, thirdYearSalary: 2.0 },
        { pick: 18, round: 2, firstYearSalary: 1.5, secondYearSalary: 1.7, thirdYearSalary: 1.9 },
        { pick: 19, round: 2, firstYearSalary: 1.4, secondYearSalary: 1.6, thirdYearSalary: 1.8 },
        { pick: 20, round: 2, firstYearSalary: 1.3, secondYearSalary: 1.5, thirdYearSalary: 1.7 },
        { pick: 21, round: 2, firstYearSalary: 1.2, secondYearSalary: 1.4, thirdYearSalary: 1.6 },
        { pick: 22, round: 2, firstYearSalary: 1.1, secondYearSalary: 1.3, thirdYearSalary: 1.5 },
        { pick: 23, round: 2, firstYearSalary: 1.0, secondYearSalary: 1.2, thirdYearSalary: 1.4 },
        { pick: 24, round: 2, firstYearSalary: 1.0, secondYearSalary: 1.1, thirdYearSalary: 1.2 },
        // Round 3 picks
        { pick: 25, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.0 },
        { pick: 26, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.0 },
        { pick: 27, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.0 },
        { pick: 28, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.0 },
        { pick: 29, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.0 },
        { pick: 30, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.0 },
        { pick: 31, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.0 },
        { pick: 32, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.0 },
        { pick: 33, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.0 },
        { pick: 34, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.0 },
        { pick: 35, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.0 },
        { pick: 36, round: 3, firstYearSalary: 1.0, secondYearSalary: 1.0, thirdYearSalary: 1.0 },
      ],
    },
  };

  return {
    name: sleeperLeague.name,
    season: parseInt(sleeperLeague.season),
    // Valor padrão de salary cap, configurável posteriormente
    salaryCap: 279000000,
    totalTeams:
      sleeperLeague.num_teams ?? sleeperLeague.settings.num_teams ?? sleeperLeague.total_rosters,
    status: mapSleeperStatusToLocal(sleeperLeague.status),
    sleeperLeagueId: sleeperLeague.league_id,
    commissionerId,
    // Adicionar propriedades obrigatórias do tipo League
    maxFranchiseTags: defaultSettings.maxFranchiseTags,
    annualIncreasePercentage: defaultSettings.annualIncreasePercentage,
    minimumSalary: defaultSettings.minimumSalary,
    seasonTurnoverDate: defaultSettings.seasonTurnoverDate,
    settings: defaultSettings,
  };
}

/**
 * Transforma dados de rosters da Sleeper para times locais
 */
export function transformSleeperRostersToTeams(
  sleeperRosters: SleeperRoster[],
  sleeperUsers: SleeperUser[],
  leagueId: string,
): Omit<Team, 'id' | 'createdAt' | 'updatedAt'>[] {
  return sleeperRosters.map(roster => {
    const user = sleeperUsers.find(u => u.user_id === roster.owner_id);
    const teamName =
      user?.metadata?.team_name || `Time sem nome (${user?.display_name || roster.roster_id})`;

    return {
      name: teamName,
      leagueId,
      // ownerId como string vazia - será preenchido apenas na associação manual
      ownerId: '', // Campo vazio até associação manual de usuário local
      sleeperOwnerId: user?.user_id, // ID do proprietário no Sleeper
      ownerDisplayName: user?.display_name,
      sleeperTeamId: roster.roster_id.toString(),
      // Propriedades obrigatórias do tipo Team
      abbreviation: teamName.substring(0, 3).toUpperCase(), // Gera uma abreviação a partir do nome
      availableCap: 0, // Será calculado baseado nos contratos
      currentDeadMoney: 0,
      nextSeasonDeadMoney: 0,
      franchiseTagsUsed: 0,
    };
  });
}

/**
 * Converte rosters da Sleeper para um formato simplificado contendo
 * jogadores ativos, em reserva e no taxi squad.
 */
export function transformSleeperRosters(sleeperRosters: SleeperRoster[]): TeamRoster[] {
  return sleeperRosters.map(roster => {
    const reserve = roster.reserve ?? [];
    const taxi = roster.taxi ?? [];
    const activePlayers = (roster.players || []).filter(
      p => !reserve.includes(p) && !taxi.includes(p),
    );

    return {
      sleeperRosterId: roster.roster_id,
      ownerId: roster.owner_id,
      players: activePlayers,
      reserve,
      taxi,
    };
  });
}

/**
 * Transforma dados de jogadores da Sleeper para o modelo local
 */
export function transformSleeperPlayersToLocal(
  sleeperPlayers: Record<string, SleeperPlayer>,
  allowedPositions: string[],
): Omit<Player, 'id' | 'createdAt' | 'updatedAt'>[] {
  return Object.values(sleeperPlayers)
    .filter(p => p.fantasy_positions?.some(pos => allowedPositions.includes(pos)))
    .map(p => {
      const fantasyPositions = (p.fantasy_positions || [])
        .filter(pos => allowedPositions.includes(pos))
        .map(pos => mapSleeperPositionToLocal(pos));

      return {
        name: p.full_name || `${p.first_name} ${p.last_name}`,
        position: mapSleeperPositionToLocal(p.position),
        fantasyPositions,
        nflTeam: p.team || 'FA',
        sleeperPlayerId: p.player_id,
        isActive: p.status !== 'Inactive',
      };
    });
}

// ============================================================================
// FUNÇÕES DE MAPEAMENTO
// ============================================================================

/**
 * Mapeia status da liga da Sleeper para o modelo local
 */
function mapSleeperStatusToLocal(sleeperStatus: string): LeagueStatus {
  switch (sleeperStatus.toLowerCase()) {
    case 'in_season':
    case 'drafting':
      return LeagueStatus.ACTIVE;
    case 'pre_draft':
    case 'complete':
      return LeagueStatus.OFFSEASON;
    default:
      return LeagueStatus.ARCHIVED;
  }
}

/**
 * Mapeia posições da Sleeper para o modelo local
 */
function mapSleeperPositionToLocal(sleeperPosition: string): PlayerPosition {
  const positionMap: Record<string, PlayerPosition> = {
    QB: PlayerPosition.QB,
    RB: PlayerPosition.RB,
    WR: PlayerPosition.WR,
    TE: PlayerPosition.TE,
    K: PlayerPosition.K,
    DEF: PlayerPosition.DL, // Mapeamento aproximado
    DL: PlayerPosition.DL,
    LB: PlayerPosition.LB,
    DB: PlayerPosition.DB,
    CB: PlayerPosition.DB,
    S: PlayerPosition.DB,
  };

  return positionMap[sleeperPosition] || PlayerPosition.DB; // Valor padrão para posições desconhecidas
}

// ============================================================================
// FUNÇÃO PRINCIPAL DE IMPORTAÇÃO
// ============================================================================

/**
 * Importa uma liga completa da Sleeper API
 * Retorna todos os dados necessários para criar a liga no sistema local
 */
export async function importLeagueFromSleeper(leagueId: string, commissionerId: string) {
  try {
    // Buscar dados da liga
    const [sleeperLeague, sleeperRosters, sleeperUsers, sleeperPlayers] = await Promise.all([
      fetchSleeperLeague(leagueId),
      fetchSleeperRosters(leagueId),
      fetchSleeperUsers(leagueId),
      fetchSleeperPlayers(),
    ]);

    const allowedPositions = sleeperLeague.roster_positions.filter(
      pos => pos !== 'FLEX' && pos !== 'BN',
    );

    // Transformar dados para o modelo local
    const league = transformSleeperLeagueToLocal(sleeperLeague, commissionerId);
    const teams = transformSleeperRostersToTeams(sleeperRosters, sleeperUsers, leagueId);
    const rosters = transformSleeperRosters(sleeperRosters);

    // Coletar todos os jogadores dos rosters
    const players = transformSleeperPlayersToLocal(sleeperPlayers, allowedPositions);

    return {
      league,
      teams,
      players,
      rosters,
      sleeperData: {
        league: sleeperLeague,
        rosters: sleeperRosters,
        users: sleeperUsers,
      },
    };
  } catch (error) {
    console.error('Erro ao importar liga da Sleeper:', error);
    throw new Error(
      error instanceof Error
        ? `Falha na importação: ${error.message}`
        : 'Erro desconhecido durante a importação',
    );
  }
}

/**
 * Valida se um ID de liga da Sleeper é válido
 */
export async function validateSleeperLeagueId(leagueId: string): Promise<boolean> {
  try {
    await fetchSleeperLeague(leagueId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sincroniza uma liga existente com dados atualizados da Sleeper API
 *
 * @param league Liga existente no sistema local
 * @returns Dados atualizados da liga, times e jogadores
 */
export async function syncLeagueWithSleeper(league: League) {
  try {
    // Verificar se a liga tem ID do Sleeper
    if (!league.sleeperLeagueId) {
      throw new Error('Esta liga não possui integração com o Sleeper');
    }

    // Buscar dados atualizados da liga
    const [sleeperLeague, sleeperRosters, sleeperUsers, sleeperPlayers] = await Promise.all([
      fetchSleeperLeague(league.sleeperLeagueId),
      fetchSleeperRosters(league.sleeperLeagueId),
      fetchSleeperUsers(league.sleeperLeagueId),
      fetchSleeperPlayers(),
    ]);

    const allowedPositions = sleeperLeague.roster_positions.filter(
      pos => pos !== 'FLEX' && pos !== 'BN',
    );

    // Transformar dados para o modelo local
    const updatedLeagueData = transformSleeperLeagueToLocal(sleeperLeague, league.commissionerId);
    const updatedTeams = transformSleeperRostersToTeams(sleeperRosters, sleeperUsers, league.id);

    const updatedPlayers = transformSleeperPlayersToLocal(sleeperPlayers, allowedPositions);

    return {
      league: {
        ...league,
        name: updatedLeagueData.name,
        season: updatedLeagueData.season,
        totalTeams: updatedLeagueData.totalTeams,
        status: updatedLeagueData.status,
      },
      teams: updatedTeams,
      players: updatedPlayers,
      sleeperData: {
        league: sleeperLeague,
        rosters: sleeperRosters,
        users: sleeperUsers,
      },
    };
  } catch (error) {
    console.error('Erro ao sincronizar liga com Sleeper:', error);
    throw new Error(
      error instanceof Error
        ? `Falha na sincronização: ${error.message}`
        : 'Erro desconhecido durante a sincronização',
    );
  }
}

// ============================================================================
// CLASSE SLEEPER SERVICE
// ============================================================================

/**
 * Classe que agrupa todos os serviços relacionados à integração com a Sleeper API
 */
export class SleeperService {
  /**
   * Busca dados de uma liga específica na Sleeper API
   */
  static async fetchLeague(leagueId: string): Promise<SleeperLeague> {
    return fetchSleeperLeague(leagueId);
  }

  /**
   * Busca rosters de uma liga específica na Sleeper API
   */
  static async fetchRosters(leagueId: string): Promise<SleeperRoster[]> {
    return fetchSleeperRosters(leagueId);
  }

  /**
   * Busca dados de usuários de uma liga específica na Sleeper API
   */
  static async fetchUsers(leagueId: string): Promise<SleeperUser[]> {
    return fetchSleeperUsers(leagueId);
  }

  /**
   * Busca dados de todos os jogadores da NFL na Sleeper API
   */
  static async fetchPlayers(): Promise<Record<string, SleeperPlayer>> {
    return fetchSleeperPlayers();
  }

  /**
   * Importa uma liga completa da Sleeper API
   */
  static async importLeague(leagueId: string, commissionerId: string) {
    return importLeagueFromSleeper(leagueId, commissionerId);
  }

  /**
   * Valida se um ID de liga da Sleeper é válido
   */
  static async validateLeagueId(leagueId: string): Promise<boolean> {
    return validateSleeperLeagueId(leagueId);
  }

  /**
   * Sincroniza uma liga existente com dados atualizados da Sleeper API
   */
  static async syncLeague(league: League) {
    return syncLeagueWithSleeper(league);
  }
}

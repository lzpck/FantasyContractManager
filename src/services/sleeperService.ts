/**
 * Serviço de integração com a Sleeper API
 *
 * Este serviço é responsável por:
 * - Buscar dados de ligas, rosters e jogadores da Sleeper API
 * - Transformar dados da Sleeper para o modelo local
 * - Mapear estruturas de dados entre as duas plataformas
 */

import { League, Team, Player, LeagueSettings, RookieDraftSettings } from '@/types';

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
    [key: string]: any;
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
    [key: string]: any;
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
    [key: string]: any;
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

  return response.json();
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
    minimumSalary: 1.0,
    seasonTurnoverDate: '04-01',
    rookieDraft: {
      rounds: 3,
      fourthYearOption: true,
      salaryTable: {
        round1: [8.0, 7.5, 7.0, 6.5, 6.0, 5.5, 5.0, 4.5, 4.0, 3.5, 3.0, 2.5],
        round2: [2.0, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 1.0],
        round3: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
      },
    },
  };

  return {
    name: sleeperLeague.name,
    season: parseInt(sleeperLeague.season),
    salaryCap: sleeperLeague.settings.salary_cap || 279.0, // Valor padrão em milhões
    totalTeams: sleeperLeague.total_rosters,
    status: mapSleeperStatusToLocal(sleeperLeague.status),
    sleeperLeagueId: sleeperLeague.league_id,
    commissionerId,
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
    const teamName = user?.metadata?.team_name || user?.display_name || `Time ${roster.roster_id}`;

    return {
      name: teamName,
      leagueId,
      ownerId: roster.owner_id, // Será mapeado para o usuário local posteriormente
      sleeperTeamId: roster.roster_id.toString(),
      currentSalaryCap: 0, // Será calculado baseado nos contratos
      currentDeadMoney: 0,
    };
  });
}

/**
 * Transforma dados de jogadores da Sleeper para o modelo local
 */
export function transformSleeperPlayersToLocal(
  sleeperPlayers: Record<string, SleeperPlayer>,
  rosterPlayers: string[],
): Omit<Player, 'id' | 'createdAt' | 'updatedAt'>[] {
  return rosterPlayers
    .map(playerId => {
      const sleeperPlayer = sleeperPlayers[playerId];
      if (!sleeperPlayer) return null;

      return {
        name: sleeperPlayer.full_name || `${sleeperPlayer.first_name} ${sleeperPlayer.last_name}`,
        position: mapSleeperPositionToLocal(sleeperPlayer.position),
        team: sleeperPlayer.team || 'FA',
        age: sleeperPlayer.age,
        sleeperPlayerId: sleeperPlayer.player_id,
        isActive: sleeperPlayer.status !== 'Inactive',
      };
    })
    .filter((player): player is NonNullable<typeof player> => player !== null);
}

// ============================================================================
// FUNÇÕES DE MAPEAMENTO
// ============================================================================

/**
 * Mapeia status da liga da Sleeper para o modelo local
 */
function mapSleeperStatusToLocal(sleeperStatus: string): 'ACTIVE' | 'OFFSEASON' | 'ARCHIVED' {
  switch (sleeperStatus.toLowerCase()) {
    case 'in_season':
    case 'drafting':
      return 'ACTIVE';
    case 'pre_draft':
    case 'complete':
      return 'OFFSEASON';
    default:
      return 'ARCHIVED';
  }
}

/**
 * Mapeia posições da Sleeper para o modelo local
 */
function mapSleeperPositionToLocal(sleeperPosition: string): string {
  const positionMap: Record<string, string> = {
    QB: 'QB',
    RB: 'RB',
    WR: 'WR',
    TE: 'TE',
    K: 'K',
    DEF: 'DL', // Mapeamento aproximado
    DL: 'DL',
    LB: 'LB',
    DB: 'DB',
    CB: 'DB',
    S: 'DB',
  };

  return positionMap[sleeperPosition] || sleeperPosition;
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

    // Transformar dados para o modelo local
    const league = transformSleeperLeagueToLocal(sleeperLeague, commissionerId);
    const teams = transformSleeperRostersToTeams(sleeperRosters, sleeperUsers, leagueId);

    // Coletar todos os jogadores dos rosters
    const allPlayerIds = sleeperRosters.flatMap(roster => roster.players || []);
    const players = transformSleeperPlayersToLocal(sleeperPlayers, allPlayerIds);

    return {
      league,
      teams,
      players,
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

/**
 * Serviço para buscar informações do estado atual da NFL via Sleeper API
 *
 * Este serviço é responsável por:
 * - Buscar informações da temporada atual (season)
 * - Buscar informações da semana atual (week)
 * - Cache das informações para evitar múltiplas requisições
 */

// ============================================================================
// TIPOS DA SLEEPER API - NFL STATE
// ============================================================================

/**
 * Estrutura de dados do estado da NFL retornada pela Sleeper API
 */
export interface SleeperNFLState {
  week: number;
  season_type: string;
  season_start_week: number;
  season: string;
  previous_season: string;
  leg: number;
  league_has_started: boolean;
  league_create_season: string;
  display_week: number;
}

// ============================================================================
// CACHE E CONFIGURAÇÕES
// ============================================================================

/** Cache para armazenar o estado da NFL */
let nflStateCache: SleeperNFLState | null = null;
/** Timestamp do último cache */
let lastCacheTime = 0;
/** Tempo de cache em milissegundos (5 minutos) */
const CACHE_DURATION = 5 * 60 * 1000;

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Busca o estado atual da NFL via Sleeper API
 * Utiliza cache para evitar múltiplas requisições
 */
export async function getNFLState(): Promise<SleeperNFLState | null> {
  try {
    // Verificar se o cache ainda é válido
    const now = Date.now();
    if (nflStateCache && now - lastCacheTime < CACHE_DURATION) {
      return nflStateCache;
    }

    // Buscar dados da API
    const response = await fetch('https://api.sleeper.app/v1/state/nfl', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Erro ao buscar estado da NFL:', response.status, response.statusText);
      return null;
    }

    const data: SleeperNFLState = await response.json();

    // Atualizar cache
    nflStateCache = data;
    lastCacheTime = now;

    return data;
  } catch (error) {
    console.error('Erro ao buscar estado da NFL:', error);
    return null;
  }
}

/**
 * Retorna a temporada atual
 */
export async function getCurrentSeason(): Promise<number | null> {
  const state = await getNFLState();
  return state ? parseInt(state.season) : null;
}

/**
 * Retorna a semana atual
 */
export async function getCurrentWeek(): Promise<number | null> {
  const state = await getNFLState();
  return state ? state.week : null;
}

/**
 * Retorna informações formatadas da temporada e semana
 */
export async function getSeasonInfo(): Promise<{
  season: number;
  week: number;
  seasonType: string;
} | null> {
  const state = await getNFLState();

  if (!state) {
    return null;
  }

  return {
    season: parseInt(state.season),
    week: state.week,
    seasonType: state.season_type,
  };
}

/**
 * Limpa o cache (útil para testes ou forçar atualização)
 */
export function clearNFLStateCache(): void {
  nflStateCache = null;
  lastCacheTime = 0;
}

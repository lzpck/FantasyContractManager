import useSWR from 'swr';
import { Team } from '@/types';

// Fetcher para SWR
const fetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar times');
  }

  const data = await response.json();
  return data.teams || [];
};

/**
 * Hook para gerenciar times
 *
 * Carrega dados reais da API exclusivamente.
 * Não utiliza mais dados demo ou mock.
 */
export function useTeams(leagueId?: string) {
  const url = leagueId ? `/api/leagues/${leagueId}/teams` : '/api/teams';

  const {
    data: teams = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Team[]>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minuto de cache
  });

  const refreshTeams = () => {
    mutate();
  };

  return {
    teams,
    loading: isLoading,
    error: error?.message || null,
    refreshTeams,
    hasTeams: teams.length > 0,
  };
}

// Fetcher específico para um time
const teamFetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar time');
  }

  const data = await response.json();
  return data.team || null;
};

/**
 * Hook para obter um time específico por ID
 * Carrega dados reais da API exclusivamente.
 */
export function useTeam(teamId: string) {
  const {
    data: team,
    error,
    isLoading,
    mutate,
  } = useSWR<Team | null>(teamId ? `/api/teams/${teamId}` : null, teamFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minuto de cache
  });

  const refreshTeam = () => {
    mutate();
  };

  return {
    team: team || null,
    loading: isLoading,
    error: error?.message || null,
    refreshTeam,
  };
}

// Hook useUserTeams foi movido para src/hooks/useUserTeams.ts
// para evitar duplicação e usar SWR para otimização de cache

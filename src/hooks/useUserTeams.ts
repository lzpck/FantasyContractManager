import useSWR from 'swr';
import { useAuth } from './useAuth';
import { Team } from '@/types';

interface UseUserTeamsReturn {
  teams: Team[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Fetcher function para SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro ao buscar times: ${response.status}`);
  }
  return response.json();
};

/**
 * Hook para gerenciar times do usuário
 * Busca todos os times onde o usuário é proprietário
 * Usa SWR para cache automático e deduplicação de requisições.
 */
export function useUserTeams(): UseUserTeamsReturn {
  const { user } = useAuth();
  const {
    data: teams = [],
    error,
    isLoading,
    mutate,
  } = useSWR(
    user ? '/api/teams' : null, // Só faz a requisição se o usuário estiver logado
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto de cache
    },
  );

  return {
    teams,
    loading: isLoading,
    error: error?.message || null,
    refetch: mutate,
  };
}

/**
 * Hook para buscar times de uma liga específica
 */
export function useLeagueTeams(leagueId: string) {
  const { teams, loading, error, refetch } = useUserTeams();

  const leagueTeams = teams.filter(team => team.leagueId === leagueId);

  return {
    teams: leagueTeams,
    loading,
    error,
    refetch,
  };
}

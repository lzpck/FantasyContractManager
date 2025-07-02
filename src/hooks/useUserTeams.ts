import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { Team } from '@/types';

interface UseUserTeamsReturn {
  teams: Team[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook para gerenciar times do usuário
 * Busca todos os times onde o usuário é proprietário
 */
export function useUserTeams(): UseUserTeamsReturn {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Removido verificação de usuário demo

      // Buscar times reais da API
      const response = await fetch('/api/teams');

      if (!response.ok) {
        throw new Error(`Erro ao buscar times: ${response.status}`);
      }

      const data = await response.json();
      setTeams(data);
    } catch (err) {
      console.error('Erro ao buscar times:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [user]);

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams,
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

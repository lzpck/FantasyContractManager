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
  const { user, isDemoUser } = useAuth();
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

      // Para usuário demo, usar dados fictícios
      if (isDemoUser) {
        const mockTeams: Team[] = [
          {
            id: 'team-1',
            name: 'Time Demo 1',
            leagueId: 'league-1',
            ownerId: user.id,
            ownerDisplayName: user.name || 'Demo User',
            sleeperOwnerId: 'demo-owner-1',
            sleeperTeamId: 1,
            currentSalaryCap: 200000000,
            currentDeadMoney: 5000000,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'team-2',
            name: 'Time Demo 2',
            leagueId: 'league-2',
            ownerId: user.id,
            ownerDisplayName: user.name || 'Demo User',
            sleeperOwnerId: 'demo-owner-2',
            sleeperTeamId: 2,
            currentSalaryCap: 200000000,
            currentDeadMoney: 2000000,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        setTeams(mockTeams);
        setLoading(false);
        return;
      }

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
  }, [user, isDemoUser]);

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

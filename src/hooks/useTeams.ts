import { useState, useEffect } from 'react';
import { Team } from '@/types';

/**
 * Hook para gerenciar times
 *
 * Carrega dados reais da API exclusivamente.
 * Não utiliza mais dados demo ou mock.
 */
export function useTeams(leagueId?: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);
        setError(null);

        // Sempre carrega dados reais da API
        const url = leagueId ? `/api/leagues/${leagueId}/teams` : '/api/teams';
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Erro ao carregar times');
        }

        const data = await response.json();
        setTeams(data.teams || []);
      } catch (err) {
        console.error('Erro ao carregar times:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setTeams([]);
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, [leagueId]);

  const refreshTeams = async () => {
    try {
      setLoading(true);
      setError(null);

      // Sempre recarrega dados reais da API
      const url = leagueId ? `/api/leagues/${leagueId}/teams` : '/api/teams';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erro ao carregar times');
      }

      const data = await response.json();
      setTeams(data.teams || []);
    } catch (err) {
      console.error('Erro ao recarregar times:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return {
    teams,
    loading,
    error,
    refreshTeams,
    hasTeams: teams.length > 0,
  };
}

/**
 * Hook para obter um time específico por ID
 * Carrega dados reais da API exclusivamente.
 */
export function useTeam(teamId: string) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeam() {
      try {
        setLoading(true);
        setError(null);

        // Sempre carrega dados reais da API
        const response = await fetch(`/api/teams/${teamId}`);

        if (!response.ok) {
          throw new Error('Erro ao carregar time');
        }

        const data = await response.json();
        setTeam(data.team || null);
      } catch (err) {
        console.error('Erro ao carregar time:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setTeam(null);
      } finally {
        setLoading(false);
      }
    }

    if (teamId) {
      loadTeam();
    }
  }, [teamId]);

  return {
    team,
    loading,
    error,
    found: !!team,
  };
}

/**
 * Hook para obter times do usuário atual
 */
export function useUserTeams() {
  const { user, isAuthenticated } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserTeams() {
      try {
        setLoading(true);
        setError(null);

        if (!isAuthenticated) {
          setTeams([]);
          return;
        }

        // Carregar times do usuário da API
        const response = await fetch('/api/teams');

        if (!response.ok) {
          throw new Error('Erro ao carregar times');
        }

        const data = await response.json();
        const userTeams = (data.teams || []).filter((team: Team) => team.ownerId === user?.id);
        setTeams(userTeams);
      } catch (err) {
        console.error('Erro ao carregar times do usuário:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setTeams([]);
      } finally {
        setLoading(false);
      }
    }

    loadUserTeams();
  }, [isAuthenticated, user?.id]);

  return {
    teams,
    loading,
    error,
    hasTeams: teams.length > 0,
  };
}

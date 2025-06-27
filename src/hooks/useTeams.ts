import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { Team } from '@/types';
import { getDemoTeams } from '@/data/demoData';

/**
 * Hook para gerenciar times
 *
 * Para o usuário demo, retorna dados fictícios.
 * Para outros usuários, carrega dados reais da API.
 */
export function useTeams(leagueId?: string) {
  const { isDemoUser } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);
        setError(null);

        if (isDemoUser) {
          // Usuário demo: retorna dados fictícios
          const demoTeams = getDemoTeams(leagueId);
          setTeams(demoTeams);
        } else {
          // Usuários reais: carrega dados da API
          const url = leagueId ? `/api/leagues/${leagueId}/teams` : '/api/teams';
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error('Erro ao carregar times');
          }

          const data = await response.json();
          setTeams(data.teams || []);
        }
      } catch (err) {
        console.error('Erro ao carregar times:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setTeams([]);
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, [isDemoUser, leagueId]);

  const refreshTeams = () => {
    if (isDemoUser) {
      // Para usuário demo, apenas recarrega os dados fictícios
      const demoTeams = getDemoTeams(leagueId);
      setTeams(demoTeams);
    } else {
      // Para usuários reais, recarrega da API
      // Implementar lógica de refresh da API aqui
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
 */
export function useTeam(teamId: string) {
  const { isDemoUser } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeam() {
      try {
        setLoading(true);
        setError(null);

        if (isDemoUser) {
          // Usuário demo: busca nos dados fictícios
          const demoTeams = getDemoTeams();
          const foundTeam = demoTeams.find(t => t.id === teamId);
          setTeam(foundTeam || null);
        } else {
          // Usuários reais: carrega dados da API
          const response = await fetch(`/api/teams/${teamId}`);

          if (!response.ok) {
            throw new Error('Erro ao carregar time');
          }

          const data = await response.json();
          setTeam(data.team || null);
        }
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
  }, [isDemoUser, teamId]);

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
  const { user } = useAuth();
  const { teams, loading, error } = useTeams();

  // Filtra times do usuário atual
  const userTeams = teams.filter(team => team.ownerId === user?.id);

  return {
    teams: userTeams,
    loading,
    error,
    hasTeams: userTeams.length > 0,
  };
}

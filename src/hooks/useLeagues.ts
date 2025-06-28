import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useAppContext } from '@/contexts/AppContext';
import { League } from '@/types';
import { getDemoLeagues } from '@/data/demoData';

/**
 * Hook para gerenciar ligas
 *
 * Para o usuário demo, retorna dados fictícios.
 * Para outros usuários, carrega dados reais da API.
 */
export function useLeagues() {
  const { isDemoUser } = useAuth();
  const { setLeagues: setGlobalLeagues } = useAppContext();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeagues() {
      try {
        setLoading(true);
        setError(null);

        if (isDemoUser) {
          // Usuário demo: retorna dados fictícios
          const demoLeagues = getDemoLeagues();
          setLeagues(demoLeagues);
          setGlobalLeagues(demoLeagues);
        } else {
          // Usuários reais: carrega dados da API
          const response = await fetch('/api/leagues');

          if (!response.ok) {
            throw new Error('Erro ao carregar ligas');
          }

          const data = await response.json();
          setLeagues(data.leagues || []);
          setGlobalLeagues(data.leagues || []);
        }
      } catch (err) {
        console.error('Erro ao carregar ligas:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setLeagues([]);
      } finally {
        setLoading(false);
      }
    }

    loadLeagues();
  }, [isDemoUser]);

  const refreshLeagues = () => {
    if (isDemoUser) {
      // Para usuário demo, apenas recarrega os dados fictícios
      const demoLeagues = getDemoLeagues();
      setLeagues(demoLeagues);
      setGlobalLeagues(demoLeagues);
    } else {
      // Para usuários reais, recarrega da API
      // Implementar lógica de refresh da API aqui
    }
  };

  return {
    leagues,
    loading,
    error,
    refreshLeagues,
    hasLeagues: leagues.length > 0,
  };
}

/**
 * Hook para obter uma liga específica por ID
 */
export function useLeague(leagueId: string) {
  const { leagues, loading, error } = useLeagues();
  const league = leagues.find(l => l.id === leagueId);

  return {
    league,
    loading,
    error,
    found: !!league,
  };
}

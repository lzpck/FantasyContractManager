import { useState, useEffect } from 'react';
import { League } from '@/types';
import { useAuth } from './useAuth';
import { useAppContext } from '@/contexts/AppContext';

/**
 * Hook para gerenciar ligas do usuário
 * 
 * Carrega dados reais da API.
 */
export function useLeagues() {
  const { isAuthenticated } = useAuth();
  const { leagues: globalLeagues, setLeagues: setGlobalLeagues } = useAppContext();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar ligas
  const loadLeagues = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isAuthenticated) {
        setLeagues([]);
        setGlobalLeagues([]);
        return;
      }

      // Carregar da API
      const response = await fetch('/api/leagues');
      if (!response.ok) {
        throw new Error('Erro ao carregar ligas');
      }

      const data = await response.json();
      if (data.success) {
        setLeagues(data.leagues);
        setGlobalLeagues(data.leagues);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar ligas';
      setError(errorMessage);
      console.error('Erro ao carregar ligas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar ligas na inicialização
  useEffect(() => {
    loadLeagues();
  }, [isAuthenticated]);

  // Recarregar ligas
  const reloadLeagues = async () => {
    await loadLeagues();
  };

  return {
    leagues,
    loading,
    error,
    reloadLeagues,
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

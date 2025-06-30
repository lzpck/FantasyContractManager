import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useAppContext } from '@/contexts/AppContext';
import { League, LeagueSettings } from '@/types';
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
          const apiLeagues = data.leagues || [];

          // Converter para o formato utilizado no frontend
          const transformed: League[] = apiLeagues.map((l: any) => {
            const settings: LeagueSettings = {
              maxFranchiseTags: l.maxFranchiseTags,
              annualIncreasePercentage: l.annualIncreasePercentage,
              minimumSalary: l.minimumSalary,
              seasonTurnoverDate: l.seasonTurnoverDate,
              rookieDraft: {
                rounds: l.settings?.rookieDraft?.rounds ?? 3,
                firstRoundFourthYearOption:
                  l.settings?.rookieDraft?.firstRoundFourthYearOption ?? true,
                salaryTable: l.settings?.rookieDraft?.salaryTable ?? [],
              },
            };

            // Parse do deadMoneyConfig se existir
            let deadMoneyConfig;
            if (l.deadMoneyConfig) {
              try {
                deadMoneyConfig = typeof l.deadMoneyConfig === 'string' 
                  ? JSON.parse(l.deadMoneyConfig) 
                  : l.deadMoneyConfig;
              } catch (error) {
                console.warn('Erro ao fazer parse do deadMoneyConfig:', error);
                deadMoneyConfig = undefined;
              }
            }

            return {
              ...l,
              settings,
              deadMoneyConfig,
            } as League;
          });

          setLeagues(transformed);
          setGlobalLeagues(transformed);
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

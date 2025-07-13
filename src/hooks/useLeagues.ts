import { useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { useAppContext } from '@/contexts/AppContext';
import { League, LeagueSettings } from '@/types';

// Fetcher function para SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Erro ao carregar ligas');
  }
  const data = await response.json();
  return data.leagues || [];
};

/**
 * Hook para gerenciar ligas
 *
 * Usa SWR para cache automático e deduplicação de requisições.
 */
export function useLeagues() {
  const { setLeagues: setGlobalLeagues } = useAppContext();

  const {
    data: apiLeagues = [],
    error,
    isLoading,
    mutate,
  } = useSWR('/api/leagues', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minuto de cache
  });

  // Transformar dados quando disponíveis (memoizado para evitar recriações desnecessárias)
  const leagues: League[] = useMemo(() => {
    return apiLeagues.map((l: any) => {
      // Converter para o formato utilizado no frontend
      const settings: LeagueSettings = {
        maxFranchiseTags: l.maxFranchiseTags,
        annualIncreasePercentage: l.annualIncreasePercentage,
        minimumSalary: l.minimumSalary,
        seasonTurnoverDate: l.seasonTurnoverDate,
        rookieDraft: {
          rounds: l.settings?.rookieDraft?.rounds ?? 3,
          firstRoundFourthYearOption: l.settings?.rookieDraft?.firstRoundFourthYearOption ?? true,
          salaryTable: l.settings?.rookieDraft?.salaryTable ?? [],
        },
      };

      // Parse do deadMoneyConfig se existir
      let deadMoneyConfig;
      if (l.deadMoneyConfig) {
        try {
          deadMoneyConfig =
            typeof l.deadMoneyConfig === 'string'
              ? JSON.parse(l.deadMoneyConfig)
              : l.deadMoneyConfig;
        } catch (parseError) {
          console.warn('Erro ao fazer parse do deadMoneyConfig:', parseError);
          deadMoneyConfig = undefined;
        }
      }

      return {
        ...l,
        settings,
        deadMoneyConfig,
      } as League;
    });
  }, [apiLeagues]);

  // Atualizar contexto global quando dados mudarem
  useEffect(() => {
    if (leagues.length > 0) {
      setGlobalLeagues(leagues);
    }
  }, [leagues, setGlobalLeagues]);

  const refreshLeagues = async () => {
    // Revalida os dados do SWR
    await mutate();
  };

  return {
    leagues,
    loading: isLoading,
    error: error?.message || null,
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

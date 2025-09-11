'use client';

import { useState, useEffect, useCallback } from 'react';
import { TeamStanding, StandingsSortBy, League, TeamFinancialSummary } from '@/types';
import { SleeperRoster } from '@/services/sleeperService';

/**
 * Hook para gerenciar dados de classificação da liga
 *
 * Combina dados financeiros locais com dados de vitórias/derrotas do Sleeper
 * para criar uma classificação completa dos times.
 */
export function useStandings(leagueId: string, league: League | null) {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playoffTeamsCount, setPlayoffTeamsCount] = useState<number>(6);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  /**
   * Busca dados de classificação usando o endpoint específico
   */
  const fetchStandingsData = useCallback(async (): Promise<{
    standings: TeamStanding[];
    playoffTeamsCount: number;
    lastSync: string;
    sleeperDataAvailable: boolean;
  } | null> => {
    if (!league?.id) {
      console.warn('⚠️ Liga não possui ID configurado');
      return null;
    }

    try {
      console.log(`📊 Buscando classificação para liga ${league.id}`);

      const response = await fetch(`/api/leagues/${league.id}/standings`);

      if (!response.ok) {
        console.error(`❌ Erro ao buscar classificação: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (!data.success) {
        console.error('❌ Resposta de erro da API:', data.error);
        return null;
      }

      console.log(
        `✅ Classificação carregada: ${data.standings.length} times, dados Sleeper: ${data.sleeperDataAvailable ? 'sim' : 'não'}`,
      );

      return {
        standings: data.standings,
        playoffTeamsCount: data.playoffTeamsCount,
        lastSync: data.lastSync,
        sleeperDataAvailable: data.sleeperDataAvailable,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar classificação:', error);
      return null;
    }
  }, [league?.id]);

  // Função removida - dados financeiros agora são calculados no endpoint específico

  // Função removida - combinação de dados agora é feita no endpoint específico

  /**
   * Carrega dados de classificação usando o endpoint específico
   */
  const loadStandings = useCallback(async () => {
    if (!leagueId || !league) {
      console.warn('loadStandings: leagueId ou league não disponível', {
        leagueId,
        league: !!league,
      });
      return;
    }

    console.log('🔄 Iniciando carregamento da classificação para liga:', league.name);
    setLoading(true);
    setError(null);

    try {
      const standingsData = await fetchStandingsData();

      if (!standingsData) {
        throw new Error('Falha ao carregar dados de classificação');
      }

      if (standingsData.standings.length === 0) {
        throw new Error('Nenhum time encontrado na liga');
      }

      // Atualizar estado
      setStandings(standingsData.standings);
      setPlayoffTeamsCount(standingsData.playoffTeamsCount);
      setLastSync(new Date(standingsData.lastSync));

      console.log(
        `✅ Classificação carregada: ${standingsData.standings.length} times, dados Sleeper: ${standingsData.sleeperDataAvailable ? 'disponíveis' : 'indisponíveis'}`,
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro crítico ao carregar classificação:', err);
      setError(`Erro crítico: ${errorMsg}`);
      // Não limpar standings aqui - manter dados anteriores se existirem
    } finally {
      setLoading(false);
    }
  }, [league, fetchStandingsData]);

  /**
   * Ordena classificação por critério específico
   */
  const sortStandings = useCallback(
    (standings: TeamStanding[], sortBy: 'position' | 'name' | 'wins' | 'pct' | 'pointsFor') => {
      return [...standings].sort((a, b) => {
        switch (sortBy) {
          case 'position':
            return a.position - b.position;
          case 'name':
            return a.team.name.localeCompare(b.team.name);
          case 'wins':
            return b.wins - a.wins;
          case 'pct':
            return b.pct - a.pct;
          case 'pointsFor':
            return b.pointsFor - a.pointsFor;
          default:
            return a.position - b.position;
        }
      });
    },
    [],
  );

  // Posições e status de playoff já são calculados no endpoint específico

  /**
   * Filtra classificação por texto
   */
  const filterStandings = useCallback(
    (searchText: string): TeamStanding[] => {
      if (!searchText.trim()) {
        return standings;
      }

      const search = searchText.toLowerCase();
      return standings.filter(
        standing =>
          standing.team.name.toLowerCase().includes(search) ||
          standing.team.ownerDisplayName?.toLowerCase().includes(search) ||
          standing.team.abbreviation.toLowerCase().includes(search),
      );
    },
    [standings],
  );

  // Carregar dados quando o componente montar e a liga estiver disponível
  useEffect(() => {
    if (league) {
      loadStandings();
    }
  }, [loadStandings, league]);

  return {
    standings,
    loading,
    error,
    lastSync,
    playoffTeamsCount,
    loadStandings,
    sortStandings,
    filterStandings,
  };
}

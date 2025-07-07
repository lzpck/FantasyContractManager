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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  /**
   * Busca dados de classificação do Sleeper
   */
  const fetchSleeperStandings = useCallback(async (): Promise<SleeperRoster[]> => {
    if (!league?.sleeperLeagueId) {
      throw new Error('Liga não possui ID do Sleeper configurado');
    }

    const response = await fetch(`https://api.sleeper.app/v1/league/${league.sleeperLeagueId}/rosters`);
    if (!response.ok) {
      throw new Error('Erro ao buscar dados do Sleeper');
    }

    return response.json();
  }, [league?.sleeperLeagueId]);

  /**
   * Busca dados financeiros locais dos times
   */
  const fetchTeamFinancials = useCallback(async (): Promise<TeamFinancialSummary[]> => {
    const response = await fetch(`/api/leagues/${leagueId}/teams`);
    if (!response.ok) {
      throw new Error('Erro ao buscar dados financeiros dos times');
    }

    const data = await response.json();
    return data.teams || [];
  }, [leagueId]);

  /**
   * Combina dados do Sleeper com dados financeiros locais
   */
  const combineStandingsData = useCallback(
    (sleeperRosters: SleeperRoster[], teamFinancials: TeamFinancialSummary[]): TeamStanding[] => {
      const standings: TeamStanding[] = [];

      // Para cada time financeiro, encontrar dados correspondentes no Sleeper
      teamFinancials.forEach(financial => {
        const sleeperRoster = sleeperRosters.find(
          roster => roster.owner_id === financial.team.sleeperOwnerId
        );

        // Calcular pontos com decimais
        const pointsFor = sleeperRoster 
          ? sleeperRoster.settings.fpts + (sleeperRoster.settings.fpts_decimal / 100)
          : 0;
        const pointsAgainst = sleeperRoster 
          ? sleeperRoster.settings.fpts_against + (sleeperRoster.settings.fpts_against_decimal / 100)
          : 0;

        // Extrair streak dos metadados
        const streak = sleeperRoster?.metadata?.streak || '-';

        const standing: TeamStanding = {
          position: 0, // Será calculado após ordenação
          team: financial.team,
          financialSummary: financial,
          wins: sleeperRoster?.settings.wins || 0,
          losses: sleeperRoster?.settings.losses || 0,
          ties: sleeperRoster?.settings.ties || 0,
          pointsFor,
          pointsAgainst,
          streak,
          isPlayoffTeam: false, // Será calculado após ordenação
          sleeperData: sleeperRoster ? {
            rosterId: sleeperRoster.roster_id,
            ownerId: sleeperRoster.owner_id,
            settings: sleeperRoster.settings,
            metadata: sleeperRoster.metadata
          } : undefined
        };

        standings.push(standing);
      });

      // Ordenar por critério de desempate (vitórias, depois pontos feitos)
      standings.sort((a, b) => {
        // Primeiro por vitórias (decrescente)
        if (a.wins !== b.wins) {
          return b.wins - a.wins;
        }
        // Depois por pontos feitos (decrescente)
        return b.pointsFor - a.pointsFor;
      });

      // Atribuir posições e marcar zona de playoffs
      standings.forEach((standing, index) => {
        standing.position = index + 1;
        standing.isPlayoffTeam = index < 6; // Top 6 são playoffs
      });

      return standings;
    },
    []
  );

  /**
   * Carrega dados de classificação
   */
  const loadStandings = useCallback(async () => {
    if (!league) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar dados em paralelo
      const [sleeperRosters, teamFinancials] = await Promise.all([
        fetchSleeperStandings(),
        fetchTeamFinancials()
      ]);

      // Combinar dados
      const combinedStandings = combineStandingsData(sleeperRosters, teamFinancials);
      
      setStandings(combinedStandings);
      setLastSync(new Date());
    } catch (err) {
      console.error('Erro ao carregar classificação:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [league, fetchSleeperStandings, fetchTeamFinancials, combineStandingsData]);

  /**
   * Ordena classificação por critério específico
   */
  const sortStandings = useCallback((sortBy: StandingsSortBy, order: 'asc' | 'desc' = 'desc') => {
    setStandings(current => {
      const sorted = [...current].sort((a, b) => {
        let valueA: number | string;
        let valueB: number | string;

        switch (sortBy) {
          case 'position':
            valueA = a.position;
            valueB = b.position;
            break;
          case 'name':
            valueA = a.team.name.toLowerCase();
            valueB = b.team.name.toLowerCase();
            break;
          case 'wins':
            valueA = a.wins;
            valueB = b.wins;
            break;
          case 'losses':
            valueA = a.losses;
            valueB = b.losses;
            break;
          case 'pointsFor':
            valueA = a.pointsFor;
            valueB = b.pointsFor;
            break;
          case 'pointsAgainst':
            valueA = a.pointsAgainst;
            valueB = b.pointsAgainst;
            break;
          case 'availableCap':
            valueA = a.financialSummary.availableCap;
            valueB = b.financialSummary.availableCap;
            break;
          case 'totalSalaries':
            valueA = a.financialSummary.totalSalaries;
            valueB = b.financialSummary.totalSalaries;
            break;
          default:
            valueA = a.position;
            valueB = b.position;
        }

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return order === 'asc' 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }

        const numA = Number(valueA);
        const numB = Number(valueB);
        return order === 'asc' ? numA - numB : numB - numA;
      });

      // Recalcular posições se não estiver ordenando por posição
      if (sortBy !== 'position') {
        sorted.forEach((standing, index) => {
          standing.position = index + 1;
          standing.isPlayoffTeam = index < 6;
        });
      }

      return sorted;
    });
  }, []);

  /**
   * Filtra classificação por texto
   */
  const filterStandings = useCallback((searchText: string): TeamStanding[] => {
    if (!searchText.trim()) {
      return standings;
    }

    const search = searchText.toLowerCase();
    return standings.filter(standing => 
      standing.team.name.toLowerCase().includes(search) ||
      standing.team.ownerDisplayName?.toLowerCase().includes(search) ||
      standing.team.abbreviation.toLowerCase().includes(search)
    );
  }, [standings]);

  // Carregar dados iniciais
  useEffect(() => {
    if (league && leagueId) {
      loadStandings();
    }
  }, [league, leagueId, loadStandings]);

  return {
    standings,
    loading,
    error,
    lastSync,
    loadStandings,
    sortStandings,
    filterStandings
  };
}
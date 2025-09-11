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
   * Busca dados de classificação do Sleeper
   */
  const fetchSleeperStandings = useCallback(async (): Promise<SleeperRoster[]> => {
    if (!league?.sleeperLeagueId) {
      throw new Error('Liga não possui ID do Sleeper configurado');
    }

    const response = await fetch(
      `https://api.sleeper.app/v1/league/${league.sleeperLeagueId}/rosters`,
    );
    if (!response.ok) {
      throw new Error('Erro ao buscar dados do Sleeper');
    }

    return response.json();
  }, [league?.sleeperLeagueId]);

  /**
   * Busca dados básicos dos times e calcula dados financeiros
   */
  const fetchTeamFinancials = useCallback(async (): Promise<TeamFinancialSummary[]> => {
    // Aguardar a liga estar carregada
    if (!league) {
      return [];
    }
    const response = await fetch(`/api/leagues/${leagueId}/teams`);
    if (!response.ok) {
      throw new Error('Erro ao buscar dados dos times');
    }

    const data = await response.json();
    const teams = data.teams || [];

    // Calcular dados financeiros para cada time
    const teamFinancials = await Promise.all(
      teams.map(async (team: any) => {
        try {
          // Buscar contratos ativos do time
          const contractsResponse = await fetch(`/api/teams/${team.id}/contracts`);
          let contracts = [];
          let totalSalaries = 0;
          let contractsExpiring = 0;

          if (contractsResponse.ok) {
            const contractsData = await contractsResponse.json();
            contracts = contractsData.contracts || [];

            // Calcular total de salários dos contratos ativos
            totalSalaries = contracts.reduce((sum: number, contract: any) => {
              return sum + (contract.currentSalary || 0);
            }, 0);

            // Contar contratos expirando (1 ano restante)
            contractsExpiring = contracts.filter(
              (contract: any) => contract.yearsRemaining === 1,
            ).length;
          }

          // Buscar registros de dead money
          let currentDeadMoney = 0;
          let nextSeasonDeadMoney = 0;

          try {
            const deadMoneyResponse = await fetch(`/api/teams/${team.id}/dead-money`);
            if (deadMoneyResponse.ok) {
              const deadMoneyRecords = await deadMoneyResponse.json();
              const currentYear = league?.season || new Date().getFullYear();
              const nextYear = currentYear + 1;

              // Calcular dead money do ano atual
              currentDeadMoney = deadMoneyRecords
                .filter((dm: any) => dm.teamId === team.id && dm.year === currentYear)
                .reduce((sum: number, dm: any) => sum + dm.amount, 0);

              // Calcular dead money da próxima temporada
              nextSeasonDeadMoney = deadMoneyRecords
                .filter((dm: any) => dm.teamId === team.id && dm.year === nextYear)
                .reduce((sum: number, dm: any) => sum + dm.amount, 0);
            }
          } catch (error) {
            // Fallback para valores agregados do team
            currentDeadMoney = team.currentDeadMoney || 0;
            nextSeasonDeadMoney = team.nextSeasonDeadMoney || 0;
          }

          // Calcular cap disponível
          const salaryCap = league?.salaryCap || 279000000;
          const availableCap = salaryCap - totalSalaries - currentDeadMoney;

          // Projetar cap da próxima temporada
          const projectedSalariesIncrease = totalSalaries * 0.15;
          const projectedNextSeasonCap =
            salaryCap - (totalSalaries + projectedSalariesIncrease) - nextSeasonDeadMoney;

          return {
            team: {
              ...team,
              abbreviation: team.abbreviation || team.name.substring(0, 3).toUpperCase(),
              availableCap,
            },
            totalSalaries,
            availableCap,
            currentDeadMoney,
            nextSeasonDeadMoney,
            projectedNextSeasonCap,
            contractsExpiring,
            playersWithContracts: contracts,
          };
        } catch (error) {
          console.error('Erro ao calcular dados financeiros do time:', error);

          // Fallback com valores zerados em caso de erro
          const salaryCap = league?.salaryCap || 279000000;
          const availableCap = salaryCap - (team.currentDeadMoney || 0);

          return {
            team: {
              ...team,
              abbreviation: team.abbreviation || team.name.substring(0, 3).toUpperCase(),
              availableCap,
            },
            totalSalaries: 0,
            availableCap,
            currentDeadMoney: team.currentDeadMoney || 0,
            nextSeasonDeadMoney: team.nextSeasonDeadMoney || 0,
            projectedNextSeasonCap: availableCap,
            contractsExpiring: 0,
            playersWithContracts: [],
          };
        }
      }),
    );

    return teamFinancials;
  }, [leagueId, league]);

  /**
   * Combina dados do Sleeper com dados financeiros locais
   */
  const combineStandingsData = useCallback(
    (
      sleeperRosters: SleeperRoster[],
      teamFinancials: TeamFinancialSummary[],
      playoffTeams?: number,
    ): TeamStanding[] => {
      if (!teamFinancials || teamFinancials.length === 0) {
        console.warn('❌ Nenhum time disponível para combinar dados');
        return [];
      }

      console.log(
        `🔗 Combinando dados: ${teamFinancials.length} times, ${sleeperRosters.length} rosters Sleeper`,
      );

      const standings: TeamStanding[] = [];

      // Para cada time financeiro, encontrar dados correspondentes no Sleeper
      teamFinancials.forEach(financial => {
        // Verificar se o time existe
        if (!financial.team) {
          console.warn('❌ Time inválido encontrado:', financial);
          return;
        }

        // Buscar dados do Sleeper apenas se o time tem sleeperOwnerId
        const sleeperRoster = financial.team.sleeperOwnerId
          ? sleeperRosters.find(roster => roster.owner_id === financial.team.sleeperOwnerId)
          : null;

        // Se não tem sleeperOwnerId, avisar mas continuar processando
        if (!financial.team.sleeperOwnerId) {
          console.warn(
            '⚠️ Time sem sleeperOwnerId encontrado, usando dados padrão:',
            financial.team.name,
          );
        }

        if (!sleeperRoster && sleeperRosters.length > 0 && financial.team.sleeperOwnerId) {
          console.warn(
            `⚠️ Roster do Sleeper não encontrado para time ${financial.team.name} (sleeperOwnerId: ${financial.team.sleeperOwnerId})`,
          );
        }

        // Calcular pontos com decimais
        const pointsFor = sleeperRoster
          ? sleeperRoster.settings.fpts + (sleeperRoster.settings.fpts_decimal || 0) / 100
          : 0;
        const pointsAgainst = sleeperRoster
          ? sleeperRoster.settings.fpts_against +
            (sleeperRoster.settings.fpts_against_decimal || 0) / 100
          : 0;

        // Extrair streak dos metadados
        const streak = sleeperRoster?.metadata?.streak || '-';

        // Extrair dados de vitórias/derrotas
        const wins = sleeperRoster?.settings.wins ?? 0;
        const losses = sleeperRoster?.settings.losses ?? 0;
        const ties = sleeperRoster?.settings.ties ?? 0;

        // Calcular total de jogos e PCT (porcentagem de vitórias)
        const totalGames = wins + losses + ties;
        const pct = totalGames > 0 ? (wins + ties * 0.5) / totalGames : 0;

        const standing: TeamStanding = {
          position: 0, // Será calculado após ordenação
          team: financial.team,
          financialSummary: financial,
          wins,
          losses,
          ties,
          pointsFor,
          pointsAgainst,
          streak,
          pct, // Adicionar PCT ao objeto
          isPlayoffTeam: false, // Será calculado após ordenação
          sleeperData: sleeperRoster
            ? {
                rosterId: sleeperRoster.roster_id,
                ownerId: sleeperRoster.owner_id,
                settings: sleeperRoster.settings,
                metadata: sleeperRoster.metadata,
              }
            : undefined,
        };

        console.log(
          `📊 Time ${financial.team.name}: W-L-T ${wins}-${losses}-${ties}, PF: ${pointsFor.toFixed(2)}, Salary: $${financial.totalSalaries.toLocaleString()}`,
        );

        standings.push(standing);
      });

      // Ordenar por PCT (porcentagem de vitórias), depois por pontos feitos
      standings.sort((a, b) => {
        // Primeiro por PCT (decrescente)
        if (a.pct !== b.pct) {
          return b.pct - a.pct;
        }
        // Depois por pontos feitos (decrescente) como critério de desempate
        return b.pointsFor - a.pointsFor;
      });

      console.log(
        '🏆 Classificação ordenada:',
        standings.map((t, i) => `${i + 1}. ${t.team.name} (${t.wins}-${t.losses})`).join(', '),
      );

      // Atribuir posições e marcar zona de playoffs
      const numPlayoffTeams = playoffTeams || 6; // Usar valor da liga ou padrão 6
      standings.forEach((standing, index) => {
        standing.position = index + 1;
        standing.isPlayoffTeam = index < numPlayoffTeams;
      });

      if (numPlayoffTeams > 0) {
        console.log(
          `🏆 Times de playoff (top ${numPlayoffTeams}):`,
          standings
            .slice(0, numPlayoffTeams)
            .map(t => t.team.name)
            .join(', '),
        );
      }

      return standings;
    },
    [league?.deadMoneyConfig, league?.season],
  );

  /**
   * Carrega dados de classificação
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
      // Sempre tentar buscar dados financeiros locais
      console.log('📊 Buscando dados financeiros dos times...');
      const teamFinancials = await fetchTeamFinancials();
      console.log(`✅ Dados financeiros carregados para ${teamFinancials.length} times`);

      let sleeperRosters: SleeperRoster[] = [];
      let playoffTeams: number | undefined;
      let hasSleeperError = false;
      let sleeperErrorMessage = '';

      // Tentar buscar dados do Sleeper, mas não falhar se não conseguir
      if (league?.sleeperLeagueId) {
        console.log('🏈 Buscando dados do Sleeper para liga:', league.sleeperLeagueId);
        try {
          sleeperRosters = await fetchSleeperStandings();
          console.log(`✅ Dados do Sleeper carregados para ${sleeperRosters.length} rosters`);

          // Buscar informações da liga do Sleeper para obter playoff_teams
          const response = await fetch(
            `https://api.sleeper.app/v1/league/${league.sleeperLeagueId}`,
          );
          if (response.ok) {
            const sleeperLeague = await response.json();
            playoffTeams = sleeperLeague.settings?.playoff_teams;
            if (playoffTeams) {
              setPlayoffTeamsCount(playoffTeams);
              console.log(`🏆 Configuração de playoffs: ${playoffTeams} times`);
            }
          } else {
            console.warn(
              'Não foi possível buscar configurações da liga do Sleeper:',
              response.status,
            );
          }
        } catch (sleeperErr) {
          const errorMsg =
            sleeperErr instanceof Error ? sleeperErr.message : 'Erro ao conectar com Sleeper';
          console.warn('⚠️ Erro ao buscar dados do Sleeper:', errorMsg);
          sleeperErrorMessage = errorMsg;
          hasSleeperError = true;
        }
      } else {
        console.warn('⚠️ Liga não possui sleeperLeagueId configurado');
        sleeperErrorMessage = 'Liga não possui integração com Sleeper configurada';
        hasSleeperError = true;
      }

      // Combinar dados (mesmo se não há dados do Sleeper)
      console.log('🔗 Combinando dados financeiros com dados do Sleeper...');
      const combinedStandings = combineStandingsData(sleeperRosters, teamFinancials, playoffTeams);
      console.log(`✅ Classificação gerada com ${combinedStandings.length} times`);

      setStandings(combinedStandings);
      setLastSync(new Date());

      // Definir erro apenas se houve problema crítico ou se não há dados do Sleeper
      if (hasSleeperError && combinedStandings.length > 0) {
        // Se temos dados locais mas erro do Sleeper, mostrar aviso
        setError(`Dados do Sleeper indisponíveis: ${sleeperErrorMessage}`);
      } else if (hasSleeperError && combinedStandings.length === 0) {
        // Se não temos dados nenhuns, mostrar erro crítico
        setError(`Erro crítico: ${sleeperErrorMessage}`);
      } else {
        setError(null);
      }

      console.log('✅ Classificação carregada com sucesso');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro crítico ao carregar classificação:', err);
      setError(`Erro crítico: ${errorMsg}`);
      // Não limpar standings aqui - manter dados anteriores se existirem
    } finally {
      setLoading(false);
    }
  }, [leagueId, league, fetchSleeperStandings, fetchTeamFinancials, combineStandingsData]);

  /**
   * Ordena classificação por critério específico
   */
  const sortStandings = useCallback(
    (
      sortBy: StandingsSortBy,
      order: 'asc' | 'desc' = 'asc',
      playoffTeams?: number,
    ): TeamStanding[] => {
      const numPlayoffTeams = playoffTeams || playoffTeamsCount;
      const sorted = [...standings].sort((a, b) => {
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
          case 'pct':
            valueA = a.pct;
            valueB = b.pct;
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
          return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }

        const numA = Number(valueA);
        const numB = Number(valueB);
        return order === 'asc' ? numA - numB : numB - numA;
      });

      // Recalcular posições se não estiver ordenando por posição
      if (sortBy !== 'position') {
        sorted.forEach((standing, index) => {
          standing.position = index + 1;
          standing.isPlayoffTeam = index < numPlayoffTeams;
        });
      }

      // Recalcular posições se não estiver ordenando por posição
      if (sortBy !== 'position') {
        sorted.forEach((standing, index) => {
          standing.position = index + 1;
          standing.isPlayoffTeam = index < numPlayoffTeams;
        });
      }

      setStandings(sorted);
      return sorted;
    },
    [standings, playoffTeamsCount],
  );

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

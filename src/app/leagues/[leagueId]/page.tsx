'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { League, TeamFinancialSummary, Team, StandingsSortBy } from '@/types';
import { useTeams } from '@/hooks/useTeams';
import { useLeague } from '@/hooks/useLeagues';
import { useAuth } from '@/hooks/useAuth';
import { useRosterDiff, PlayerAdded, PlayerRemoved } from '@/hooks/useRosterDiff';
import { useStandings } from '@/hooks/useStandings';
import LeagueHeader from '@/components/leagues/LeagueHeader';
import TeamsTable from '@/components/leagues/TeamsTable';
import { StandingsTable } from '@/components/leagues/StandingsTable';
import { SyncButton } from '@/components/leagues/SyncButton';
import { FilterSortBar } from '@/components/leagues/FilterSortBar';
import RosterTransactions from '@/components/leagues/RosterTransactions';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

/**
 * Página de detalhes da liga
 *
 * Exibe informações completas da liga, lista de times com salary cap,
 * funcionalidades de filtro/ordenação e sincronização com Sleeper.
 */
export default function LeagueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.leagueId as string;
  const { league: fetchedLeague, loading: leagueLoading } = useLeague(leagueId);
  const { user, canImportLeague } = useAuth();

  // Estados locais
  const [league, setLeague] = useState<League | null>(null);
  const [teamsFinancialSummary, setTeamsFinancialSummary] = useState<TeamFinancialSummary[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<TeamFinancialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'availableCap' | 'totalSalaries'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');
  
  // Estado para controle das abas
  const [activeTab, setActiveTab] = useState('teams');

  // Estados para transações de roster
  const [playersAdded, setPlayersAdded] = useState<PlayerAdded[]>([]);
  const [playersRemoved, setPlayersRemoved] = useState<PlayerRemoved[]>([]);
  const [tradesProcessed, setTradesProcessed] = useState<any[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);

  const { teams, loading: teamsLoading } = useTeams(leagueId);
  const { calculateRosterDiff, isLoading: rosterDiffLoading } = useRosterDiff();
  
  // Hook para classificação
  const { 
    standings, 
    loading: standingsLoading, 
    error: standingsError,
    loadStandings,
    sortStandings 
  } = useStandings(leagueId, league);

  // Encontrar o time do usuário atual na liga
  const userTeam = teams.find(team => team.ownerId === user?.id) || null;

  // Definir liga quando carregada
  useEffect(() => {
    if (!leagueLoading) {
      setLeague(fetchedLeague || null);
    }
  }, [fetchedLeague, leagueLoading]);

  // Função para calcular dados financeiros reais do time
  const calculateTeamFinancials = async (team: Team): Promise<TeamFinancialSummary> => {
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

      // Buscar registros de dead money detalhados da API
      let currentDeadMoney = 0;
      let nextSeasonDeadMoney = 0;

      try {
        const deadMoneyResponse = await fetch(`/api/teams/${team.id}/dead-money`);
        if (deadMoneyResponse.ok) {
          const deadMoneyRecords = await deadMoneyResponse.json();
          const currentYear = league!.season;
          const nextYear = league!.season + 1;

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
        console.warn('Erro ao buscar dead money detalhado, usando valores do team:', error);
        // Fallback para valores agregados do team
        currentDeadMoney = team.currentDeadMoney || 0;
        nextSeasonDeadMoney = team.nextSeasonDeadMoney || 0;
      }

      // Se não há registros detalhados, usar valores agregados como fallback
      if (currentDeadMoney === 0 && (team.currentDeadMoney || 0) > 0) {
        currentDeadMoney = team.currentDeadMoney || 0;
      }
      if (nextSeasonDeadMoney === 0 && (team.nextSeasonDeadMoney || 0) > 0) {
        nextSeasonDeadMoney = team.nextSeasonDeadMoney || 0;
      }

      // Calcular cap disponível
      const availableCap = league!.salaryCap - totalSalaries - currentDeadMoney;

      // Projetar cap da próxima temporada (considerando aumento de 15% nos salários)
      const projectedSalariesIncrease = totalSalaries * 0.15;
      const projectedNextSeasonCap =
        league!.salaryCap - (totalSalaries + projectedSalariesIncrease) - nextSeasonDeadMoney;

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
      const availableCap = league!.salaryCap - (team.currentDeadMoney || 0);

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
  };

  // Gerar resumo financeiro com dados reais
  useEffect(() => {
    if (leagueLoading || teamsLoading || !league) return;

    async function generateFinancialSummaries() {
      try {
        setLoading(true);

        // Calcular dados financeiros para todos os times
        const summariesPromises = teams.map(team => calculateTeamFinancials(team));
        const summaries = await Promise.all(summariesPromises);

        setTeamsFinancialSummary(summaries);
      } catch (error) {
        console.error('Erro ao gerar resumos financeiros:', error);
        setTeamsFinancialSummary([]);
      } finally {
        setLoading(false);
      }
    }

    generateFinancialSummaries();
  }, [league, teams, teamsLoading, leagueLoading]);

  // Finalizar carregamento quando dados foram buscados
  useEffect(() => {
    if (!leagueLoading && !teamsLoading && !league) {
      setLoading(false);
    }
  }, [leagueLoading, teamsLoading, league]);

  // Aplicar filtros e ordenação
  useEffect(() => {
    let filtered = [...teamsFinancialSummary];

    // Aplicar filtro de texto
    if (filterText) {
      filtered = filtered.filter(summary =>
        summary.team.name.toLowerCase().includes(filterText.toLowerCase()),
      );
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (sortBy) {
        case 'name':
          valueA = a.team.name;
          valueB = b.team.name;
          break;
        case 'availableCap':
          valueA = a.availableCap;
          valueB = b.availableCap;
          break;
        case 'totalSalaries':
          valueA = a.totalSalaries;
          valueB = b.totalSalaries;
          break;
        default:
          valueA = a.team.name;
          valueB = b.team.name;
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      } else {
        return sortOrder === 'asc'
          ? (valueA as number) - (valueB as number)
          : (valueB as number) - (valueA as number);
      }
    });

    setFilteredTeams(filtered);
  }, [teamsFinancialSummary, filterText, sortBy, sortOrder]);

  // Função para sincronizar com Sleeper
  const handleSync = async () => {
    try {
      // Verificar se a liga tem ID do Sleeper
      if (!league?.sleeperLeagueId) {
        toast.error('Esta liga não possui integração com o Sleeper');
        return;
      }

      // 1. Buscar dados atuais do roster antes da sincronização
      const rosterDataResponse = await fetch(`/api/leagues/${league.id}/roster-data`);
      const rosterData = await rosterDataResponse.json();

      if (!rosterData.success) {
        throw new Error('Erro ao buscar dados do roster');
      }

      // 2. Chamar a API de sincronização
      const response = await fetch('/api/leagues/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leagueId: league.id }),
      });

      const data = await response.json();

      if (data.success) {
        // 3. Detectar diferenças no roster
        try {
          const rosterDiff = await calculateRosterDiff(
            league.sleeperLeagueId,
            rosterData.data.currentRosters,
            rosterData.data.teams,
          );

          // Atualizar estados das transações
          setPlayersAdded(rosterDiff.playersAdded);
          setPlayersRemoved(rosterDiff.playersRemoved);
          setShowTransactions(
            rosterDiff.playersAdded.length > 0 || rosterDiff.playersRemoved.length > 0,
          );

          if (rosterDiff.playersAdded.length > 0 || rosterDiff.playersRemoved.length > 0) {
            toast.success(
              `Sincronização concluída! ${rosterDiff.playersAdded.length} jogadores adicionados, ${rosterDiff.playersRemoved.length} removidos.`,
            );
          } else {
            toast.success('Sincronização concluída! Nenhuma alteração no roster detectada.');
          }
        } catch (diffError) {
          console.warn('Erro ao calcular diferenças do roster:', diffError);
          toast.success(
            'Sincronização concluída, mas não foi possível detectar alterações no roster.',
          );
        }

        // Atualizar dados locais
        setLeague(data.league);

        // Atualizar trades processadas se disponíveis
        if (data.syncStats && data.syncStats.tradesProcessed) {
          setTradesProcessed(data.syncStats.tradesProcessed);
        }

        // Atualizar dados financeiros com os novos times
        if (data.league.teams) {
          const summariesPromises = data.league.teams.map((team: Team) =>
            calculateTeamFinancials(team),
          );
          const updatedFinancialSummaries = await Promise.all(summariesPromises);
          setTeamsFinancialSummary(updatedFinancialSummaries);
        }
        
        // Atualizar dados de classificação
        await loadStandings();

        toast.success(data.message);
      } else {
        toast.error(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao sincronizar com Sleeper:', error);
      toast.error('Ocorreu um erro ao sincronizar com o Sleeper. Tente novamente mais tarde.');
    }
  };

  // Função para navegar para detalhes do time
  const handleTeamClick = (teamId: string) => {
    router.push(`/leagues/${leagueId}/teams/${teamId}`);
  };
  
  // Função para manipular ordenação da classificação
  const handleStandingsSort = (sortBy: StandingsSortBy, order: 'asc' | 'desc') => {
    sortStandings(sortBy, order);
  };

  // Função para adicionar contrato para jogador recém-adicionado
  const handleAddContract = async (sleeperPlayerId: string, teamId: string) => {
    try {
      // Por enquanto, usar valores padrão. Em uma implementação completa,
      // seria aberto um modal para o usuário inserir os valores
      const contractData = {
        sleeperPlayerId,
        teamId,
        contractValue: 1000000, // $1M padrão
        contractYears: 1, // 1 ano padrão
        guaranteedMoney: 0,
        notes: 'Contrato criado via transação de roster',
      };

      const response = await fetch('/api/roster-transactions/add-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      const data = await response.json();

      if (data.success) {
        // Remover jogador da lista de adicionados
        setPlayersAdded(prev => prev.filter(p => p.sleeperPlayerId !== sleeperPlayerId));

        // Atualizar dados financeiros
        if (league?.teams) {
          const summariesPromises = league.teams.map((team: Team) => calculateTeamFinancials(team));
          const updatedFinancialSummaries = await Promise.all(summariesPromises);
          setTeamsFinancialSummary(updatedFinancialSummaries);
        }
      } else {
        throw new Error(data.error || 'Erro ao adicionar contrato');
      }
    } catch (error) {
      console.error('Erro ao adicionar contrato:', error);
      throw error;
    }
  };

  // Função para adicionar dead money para jogador removido
  const handleAddDeadMoney = async (sleeperPlayerId: string, teamId: string) => {
    try {
      const deadMoneyData = {
        sleeperPlayerId,
        teamId,
        notes: 'Jogador cortado via transação de roster',
      };

      const response = await fetch('/api/roster-transactions/add-dead-money', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deadMoneyData),
      });

      const data = await response.json();

      if (data.success) {
        // Remover jogador da lista de removidos
        setPlayersRemoved(prev => prev.filter(p => p.sleeperPlayerId !== sleeperPlayerId));

        // Atualizar dados financeiros
        if (league?.teams) {
          const summariesPromises = league.teams.map((team: Team) => calculateTeamFinancials(team));
          const updatedFinancialSummaries = await Promise.all(summariesPromises);
          setTeamsFinancialSummary(updatedFinancialSummaries);
        }
      } else {
        throw new Error(data.error || 'Erro ao adicionar dead money');
      }
    } catch (error) {
      console.error('Erro ao adicionar dead money:', error);
      throw error;
    }
  };

  // Função para processar trade diretamente
  const handleProcessTrade = async (
    contractId: string,
    fromTeam: string,
    toTeam: string,
    playerName: string,
  ) => {
    try {
      const response = await fetch('/api/roster-transactions/process-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId,
          fromTeam,
          toTeam,
          playerName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Remover trade da lista de trades processadas
        setTradesProcessed(prev => prev.filter(trade => trade.contractId !== contractId));

        // Remover jogador das listas de adicionados e removidos para evitar duplicação
        const playerNameLower = playerName.toLowerCase().trim();
        setPlayersAdded(prev =>
          prev.filter(player => (player.name || '').toLowerCase().trim() !== playerNameLower),
        );
        setPlayersRemoved(prev =>
          prev.filter(
            player =>
              (player.playerName || player.name || '').toLowerCase().trim() !== playerNameLower,
          ),
        );

        // Atualizar dados financeiros
        if (league?.teams) {
          const summariesPromises = league.teams.map((team: Team) => calculateTeamFinancials(team));
          const updatedFinancialSummaries = await Promise.all(summariesPromises);
          setTeamsFinancialSummary(updatedFinancialSummaries);
        }
      } else {
        throw new Error(data.error || 'Erro ao processar trade');
      }
    } catch (error) {
      console.error('Erro ao processar trade:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a]">
        <div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Carregando dados da liga...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-[#0f172a]">
        <div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-slate-100 mb-2">Liga não encontrada</h2>
              <p className="text-slate-400 mb-4">A liga solicitada não foi encontrada.</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <div>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Header da liga */}
          <LeagueHeader
            league={league}
            totalTeams={teamsFinancialSummary.length}
            onBack={() => router.push('/dashboard')}
          />

          {/* Botão de sincronização - apenas para comissários */}
          {canImportLeague && (
            <div className="mb-6">
              <SyncButton onSync={handleSync} />
            </div>
          )}

          {/* Seção de transações de roster */}
          {(playersAdded.length > 0 || playersRemoved.length > 0 || tradesProcessed.length > 0) && (
            <RosterTransactions
              playersAdded={playersAdded}
              playersRemoved={playersRemoved}
              tradesProcessed={tradesProcessed}
              onAddContract={handleAddContract}
              onAddDeadMoney={handleAddDeadMoney}
              onProcessTrade={handleProcessTrade}
              onContractSaved={sleeperPlayerId => {
                // Remover jogador da lista de adicionados após contrato ser salvo
                setPlayersAdded(prev => prev.filter(p => p.sleeperPlayerId !== sleeperPlayerId));
              }}
              teams={teams}
              league={league}
            />
          )}

          {/* Sistema de abas */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="teams">Times</TabsTrigger>
              <TabsTrigger value="standings">Classificação</TabsTrigger>
            </TabsList>
            
            <TabsContent value="teams" className="space-y-4">
              {/* Barra de filtros e ordenação */}
              <FilterSortBar
                filterText={filterText}
                onFilterChange={setFilterText}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
              />

              {/* Tabela de times */}
              <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
                <TeamsTable teams={filteredTeams} onTeamClick={handleTeamClick} league={league} />
              </div>
            </TabsContent>
            
            <TabsContent value="standings" className="space-y-4">
              <StandingsTable
                standings={standings}
                loading={standingsLoading}
                error={standingsError}
                onSort={handleStandingsSort}
                onTeamClick={handleTeamClick}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { League, TeamFinancialSummary, Team } from '@/types';
import { useTeams } from '@/hooks/useTeams';
import { useLeague } from '@/hooks/useLeagues';
import LeagueHeader from '@/components/leagues/LeagueHeader';
import TeamsTable from '@/components/leagues/TeamsTable';
import { SyncButton } from '@/components/leagues/SyncButton';
import { FilterSortBar } from '@/components/leagues/FilterSortBar';

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

  // Estados locais
  const [league, setLeague] = useState<League | null>(null);
  const [teamsFinancialSummary, setTeamsFinancialSummary] = useState<TeamFinancialSummary[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<TeamFinancialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'availableCap' | 'totalSalaries'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');

  const { teams, loading: teamsLoading } = useTeams(leagueId);

  // Definir liga quando carregada
  useEffect(() => {
    if (!leagueLoading) {
      setLeague(fetchedLeague || null);
    }
  }, [fetchedLeague, leagueLoading]);

  // Gerar resumo financeiro com dados reais
  useEffect(() => {
    if (leagueLoading || teamsLoading || !league) return;

    const summaries = teams.map(team => {
      const totalSalaries = team.currentSalaryCap ?? 0;
      const availableCap = league.salaryCap - totalSalaries;

      const formattedTeam: Team = {
        ...team,
        abbreviation: team.name.substring(0, 3).toUpperCase(),
        availableCap,
        nextSeasonDeadMoney: 0,
        franchiseTagsUsed: 0,
      } as Team;

      return {
        team: formattedTeam,
        totalSalaries,
        availableCap,
        currentDeadMoney: team.currentDeadMoney ?? 0,
        nextSeasonDeadMoney: 0,
        projectedNextSeasonCap: availableCap,
        contractsExpiring: 0,
        playersWithContracts: [],
      } as TeamFinancialSummary;
    });

    setTeamsFinancialSummary(summaries);
    setLoading(false);
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
        alert('Esta liga não possui integração com o Sleeper');
        return;
      }

      // Chamar a API de sincronização
      const response = await fetch('/api/leagues/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leagueId: league.id }),
      });

      const data = await response.json();

      if (data.success) {
        // Atualizar dados locais
        setLeague(data.league);

        // Atualizar resumos financeiros com os novos times
        if (data.league.teams) {
          const updatedFinancialSummaries = data.league.teams.map((team: Team) => {
            const totalSalaries = team.currentSalaryCap ?? 0;
            const availableCap = data.league.salaryCap - totalSalaries;

            return {
              team: {
                ...team,
                abbreviation: team.name.substring(0, 3).toUpperCase(),
                availableCap,
              } as Team,
              totalSalaries,
              availableCap,
              currentDeadMoney: team.currentDeadMoney ?? 0,
              nextSeasonDeadMoney: 0,
              projectedNextSeasonCap: availableCap,
              contractsExpiring: 0,
              playersWithContracts: [],
            } as TeamFinancialSummary;
          });
          setTeamsFinancialSummary(updatedFinancialSummaries);
        }

        alert(data.message);
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao sincronizar com Sleeper:', error);
      alert('Ocorreu um erro ao sincronizar com o Sleeper. Tente novamente mais tarde.');
    }
  };

  // Função para navegar para detalhes do time
  const handleTeamClick = (teamId: string) => {
    router.push(`/leagues/${leagueId}/teams/${teamId}`);
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

          {/* Botão de sincronização */}
          <div className="mb-6">
            <SyncButton onSync={handleSync} />
          </div>

          {/* Barra de filtros e ordenação */}
          <div className="mb-6">
            <FilterSortBar
              filterText={filterText}
              onFilterChange={setFilterText}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
            />
          </div>

          {/* Tabela de times */}
          <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
            <TeamsTable teams={filteredTeams} onTeamClick={handleTeamClick} />
          </div>
        </div>
      </div>
    </div>
  );
}

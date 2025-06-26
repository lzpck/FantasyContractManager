'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { League, Team, TeamFinancialSummary } from '@/types';
import { createMockLeagueWithTeams, createMockTeamFinancialSummary } from '@/types/mocks';
import LeagueHeader from '@/components/leagues/LeagueHeader';
import TeamsTable from '@/components/leagues/TeamsTable';
import { SyncButton } from '@/components/leagues/SyncButton';
import { FilterSortBar } from '@/components/leagues/FilterSortBar';
import { Sidebar } from '@/components/layout/Sidebar';

/**
 * Página de detalhes da liga
 *
 * Exibe informações completas da liga, lista de times com salary cap,
 * funcionalidades de filtro/ordenação e sincronização com Sleeper.
 */
export default function LeagueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { state } = useAppContext();
  const leagueId = params.leagueId as string;

  // Estados locais
  const [league, setLeague] = useState<League | null>(null);
  const [teamsFinancialSummary, setTeamsFinancialSummary] = useState<TeamFinancialSummary[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<TeamFinancialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'availableCap' | 'totalSalaries'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');

  // Carregar dados da liga
  useEffect(() => {
    const loadLeagueData = () => {
      setLoading(true);

      // Buscar liga no contexto global
      const foundLeague = state.leagues.find(l => l.id === leagueId);

      if (!foundLeague) {
        // Se não encontrar, gerar dados mock para demonstração
        const mockData = createMockLeagueWithTeams(12);
        mockData.league.id = leagueId;
        mockData.league.name = 'Liga The Bad Place';

        setLeague(mockData.league);

        // Gerar resumos financeiros para cada time
        const financialSummaries = mockData.teams.map(
          team => createMockTeamFinancialSummary(team, 15), // 15 jogadores por time
        );
        setTeamsFinancialSummary(financialSummaries);
      } else {
        setLeague(foundLeague);

        // Gerar dados mock de times para a liga encontrada
        const mockData = createMockLeagueWithTeams(foundLeague.totalTeams);
        const teamsWithCorrectLeagueId = mockData.teams.map(team => ({
          ...team,
          leagueId: foundLeague.id,
        }));

        // Teams são usados apenas para gerar os resumos financeiros

        // Gerar resumos financeiros
        const financialSummaries = teamsWithCorrectLeagueId.map(team =>
          createMockTeamFinancialSummary(team, 15),
        );
        setTeamsFinancialSummary(financialSummaries);
      }

      setLoading(false);
    };

    loadLeagueData();
  }, [leagueId, state.leagues]);

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
    // Mock da sincronização - em produção, faria chamada para API do Sleeper
    alert('Sincronização com Sleeper iniciada! (Funcionalidade em desenvolvimento)');
  };

  // Função para navegar para detalhes do time
  const handleTeamClick = (teamId: string) => {
    router.push(`/leagues/${leagueId}/teams/${teamId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dados da liga...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Liga não encontrada</h2>
              <p className="text-gray-600 mb-4">A liga solicitada não foi encontrada.</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Header da liga */}
          <LeagueHeader
            league={league}
            totalTeams={teamsFinancialSummary.length}
            onSync={async () => {
              // TODO: Implementar sincronização com Sleeper
              console.log('Sincronizando dados da liga...');
            }}
            onBack={() => router.push('/dashboard')}
          />

          {/* Botão de sincronização */}
          <div className="mb-6">
            <SyncButton onSync={handleSync} />
          </div>

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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <TeamsTable teams={filteredTeams} onTeamClick={handleTeamClick} />
          </div>
        </div>
      </div>
    </div>
  );
}

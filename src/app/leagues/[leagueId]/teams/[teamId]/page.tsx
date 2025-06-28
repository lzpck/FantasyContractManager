'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Team, PlayerWithContract, League } from '@/types';
import { createMockTeamFinancialSummary, createMockLeagueWithTeams } from '@/types/mocks';
import TeamHeader from '@/components/teams/TeamHeader';
import { PlayerContractsTable } from '@/components/teams/PlayerContractsTable';
import { CapProjectionChart } from '@/components/teams/CapProjectionChart';
import PositionDistributionChart from '@/components/teams/PositionDistributionChart';
import ContractActionsModal from '@/components/teams/ContractActionsModal';
import { Sidebar } from '@/components/layout/Sidebar';

/**
 * Página de detalhes do time
 *
 * Exibe informações completas do time, elenco de jogadores,
 * gráficos de distribuição e projeções de salary cap.
 */
export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { state } = useAppContext();
  const leagueId = params.leagueId as string;
  const teamId = params.teamId as string;

  // Estados locais
  const [team, setTeam] = useState<Team | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [playersWithContracts, setPlayersWithContracts] = useState<PlayerWithContract[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerWithContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'position' | 'salary' | 'yearsRemaining'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithContract | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);

  // Carregar dados do time
  useEffect(() => {
    const loadTeamData = () => {
      setLoading(true);

      // Buscar liga no contexto global
      let foundLeague = state.leagues.find(l => l.id === leagueId);
      let foundTeam: Team | null = null;

      if (!foundLeague) {
        // Se não encontrar, gerar dados mock para demonstração
        const mockData = createMockLeagueWithTeams(12);
        mockData.league.id = leagueId;
        mockData.league.name = 'Liga The Bad Place';
        foundLeague = mockData.league;

        // Encontrar o time específico
        foundTeam = mockData.teams.find(t => t.id === teamId) || mockData.teams[0];
        foundTeam.id = teamId;

        // Gerar jogadores para o time
        const teamFinancialSummary = createMockTeamFinancialSummary(foundTeam, 20);
        setPlayersWithContracts(teamFinancialSummary.playersWithContracts);
      } else {
        // Buscar time na liga encontrada
        // Em produção, aqui faria uma busca no banco de dados
        const mockData = createMockLeagueWithTeams(12);
        foundTeam = mockData.teams.find(t => t.id === teamId) || mockData.teams[0];
        foundTeam.id = teamId;
        foundTeam.leagueId = leagueId;

        const teamFinancialSummary = createMockTeamFinancialSummary(foundTeam, 20);
        setPlayersWithContracts(teamFinancialSummary.playersWithContracts);
      }

      setLeague(foundLeague || null);
      setTeam(foundTeam);
      setLoading(false);
    };

    if (leagueId && teamId) {
      loadTeamData();
    }
  }, [leagueId, teamId, state.leagues]);

  // Aplicar filtros e ordenação
  useEffect(() => {
    if (!playersWithContracts.length) {
      setFilteredPlayers([]);
      return;
    }

    let filtered = [...playersWithContracts];

    // Aplicar filtro de texto
    if (filterText) {
      filtered = filtered.filter(
        p =>
          p.player.name.toLowerCase().includes(filterText.toLowerCase()) ||
          p.player.nflTeam.toLowerCase().includes(filterText.toLowerCase()),
      );
    }

    // Aplicar filtro de posição
    if (filterPosition !== 'all') {
      filtered = filtered.filter(p => p.player.position === filterPosition);
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.player.name;
          bValue = b.player.name;
          break;
        case 'position':
          aValue = a.player.position;
          bValue = b.player.position;
          break;
        case 'salary':
          aValue = a.contract.currentSalary;
          bValue = b.contract.currentSalary;
          break;
        case 'yearsRemaining':
          aValue = a.contract.yearsRemaining;
          bValue = b.contract.yearsRemaining;
          break;
        default:
          aValue = a.player.name;
          bValue = b.player.name;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (aValue as number) - (bValue as number);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
    });

    setFilteredPlayers(filtered);
  }, [playersWithContracts, filterText, filterPosition, sortBy, sortOrder]);

  // Handlers
  const handleBack = () => {
    router.push(`/leagues/${leagueId}`);
  };

  const handlePlayerAction = (player: PlayerWithContract) => {
    setSelectedPlayer(player);
    setShowActionsModal(true);
  };

  const handleAddPlayer = () => {
    // Mock da adição de jogador
    alert('Funcionalidade de adicionar jogador em desenvolvimento!');
  };

  // Estados de carregamento e erro
  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando dados do time...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!team || !league) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Time não encontrado</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              O time solicitado não foi encontrado.
            </p>
            <button
              onClick={handleBack}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Voltar para Liga
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header do Time */}
          <TeamHeader
            team={team}
            league={league}
            players={playersWithContracts}
            onAddPlayer={handleAddPlayer}
          />

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <PositionDistributionChart players={playersWithContracts} />
            <CapProjectionChart team={team} players={playersWithContracts} />
          </div>

          {/* Tabela de Jogadores */}
          <PlayerContractsTable
            players={filteredPlayers}
            sortBy={sortBy}
            sortOrder={sortOrder}
            filterText={filterText}
            filterPosition={filterPosition}
            onSortChange={field => {
              if (sortBy === field) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(field);
                setSortOrder('asc');
              }
            }}
            onFilterTextChange={setFilterText}
            onFilterPositionChange={setFilterPosition}
            onPlayerAction={handlePlayerAction}
          />
        </div>
      </div>

      {/* Modal de Ações */}
      {showActionsModal && selectedPlayer && (
        <ContractActionsModal
          isOpen={showActionsModal}
          player={selectedPlayer}
          onClose={() => {
            setShowActionsModal(false);
            setSelectedPlayer(null);
          }}
          onAction={action => {
            console.log('Ação:', action, 'Jogador:', selectedPlayer);
            setShowActionsModal(false);
            setSelectedPlayer(null);
          }}
        />
      )}
    </div>
  );
}

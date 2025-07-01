'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Team, PlayerWithContract, League, Player, Contract, PlayerRosterStatus } from '@/types';
import { SleeperService } from '@/services/sleeperService';
import TeamHeader from '@/components/teams/TeamHeader';
import { PlayerRosterSections } from '@/components/teams/PlayerRosterSections';
import { CapProjectionChart } from '@/components/teams/CapProjectionChart';
import PositionDistributionChart from '@/components/teams/PositionDistributionChart';
import ContractActionsModal from '@/components/teams/ContractActionsModal';
import ContractModal from '@/components/teams/ContractModal';
import { useContractModal } from '@/hooks/useContractModal';
import { useTeamFinancials } from '@/hooks/useTeamFinancials';
import { useAuth } from '@/hooks/useAuth';

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
  const [error, setError] = useState<string | null>(null);
  // Estados para modais
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithContract | null>(null);

  // Hook para buscar dados financeiros em tempo real
  const { contracts, deadMoneyRecords, revalidateFinancials } = useTeamFinancials(teamId, leagueId);

  // Hook para gerenciar o ContractModal
  const contractModal = useContractModal();
  const { user } = useAuth();
  const isCommissioner = user?.role === 'COMMISSIONER';

  // Carregar dados do time
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Buscar dados da liga
        const leagueResponse = await fetch(`/api/leagues/${leagueId}`);
        if (!leagueResponse.ok) {
          throw new Error('Liga não encontrada');
        }
        const leagueData = await leagueResponse.json();
        setLeague(leagueData.league);

        // 2. Buscar dados do time
        const teamResponse = await fetch(`/api/leagues/${leagueId}/teams`);
        if (!teamResponse.ok) {
          throw new Error('Erro ao buscar times');
        }
        const teamsData = await teamResponse.json();
        const foundTeam = teamsData.teams.find((t: Team) => t.id === teamId);

        if (!foundTeam) {
          throw new Error('Time não encontrado');
        }
        setTeam(foundTeam);

        // 3. Buscar jogadores do roster do time
        let rosterPlayers = [];
        try {
          const playersResponse = await fetch(`/api/teams/${teamId}/players`);
          if (playersResponse.ok) {
            const playersData = await playersResponse.json();
            rosterPlayers = playersData.players || [];
          }
        } catch (playersError) {
          console.warn('Erro ao buscar jogadores do roster:', playersError);
        }

        // 4. Buscar contratos existentes
        const contractsResponse = await fetch(`/api/teams/${teamId}/contracts`);
        const contractsData = contractsResponse.ok
          ? await contractsResponse.json()
          : { contracts: [] };

        // 5. Verificar se é usuário demo e usar dados demo se necessário
        let playersWithContractsData: PlayerWithContract[] = [];

        if (contractsData.message === 'Dados demo gerenciados no frontend') {
          // Usuário demo: usar dados demo
          const { getDemoPlayersWithContracts } = await import('@/data/demoData');
          playersWithContractsData = getDemoPlayersWithContracts(teamId);
        } else {
          // Usuário real: combinar dados do roster com contratos locais
          // Mostrar todos os jogadores do roster, mesmo sem contrato
          playersWithContractsData = rosterPlayers.map(rosterPlayer => {
            const existingContract = contractsData.contracts.find(
              (c: Contract) => c.player.sleeperPlayerId === rosterPlayer.sleeperPlayerId,
            );

            return {
              player: rosterPlayer.player,
              contract: existingContract || null,
              rosterStatus: rosterPlayer.status as PlayerRosterStatus,
            };
          });

          // Adicionar também jogadores com contratos que não estão no roster atual
          // (jogadores que foram cortados mas ainda têm dead money)
          const playersNotInRoster = contractsData.contracts.filter(
            (c: Contract) =>
              !rosterPlayers.some(p => p.sleeperPlayerId === c.player.sleeperPlayerId),
          );

          playersNotInRoster.forEach((contract: Contract) => {
            playersWithContractsData.push({
              player: {
                id: contract.player.id,
                sleeperPlayerId: contract.player.sleeperPlayerId,
                name: contract.player.name,
                position: contract.player.position,
                fantasyPositions: contract.player.fantasyPositions
                  ? contract.player.fantasyPositions.split(',')
                  : [contract.player.position],
                nflTeam: contract.player.nflTeam || 'FA',
                isActive: contract.player.isActive,
                createdAt: contract.player.createdAt,
                updatedAt: contract.player.updatedAt,
              },
              contract: contract,
              rosterStatus: 'cut' as PlayerRosterStatus, // Jogador foi cortado
            });
          });
        }

        setPlayersWithContracts(playersWithContractsData);
      } catch (err) {
        console.error('Erro ao carregar dados do time:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    if (leagueId && teamId) {
      loadTeamData();
    }
  }, [leagueId, teamId]);

  // Listener para refresh após salvar contrato
  useEffect(() => {
    const handleContractUpdated = () => {
      // Recarregar dados do time após salvar/editar contrato
      if (leagueId && teamId) {
        window.location.reload();
      }
    };

    window.addEventListener('contractUpdated', handleContractUpdated);

    return () => {
      window.removeEventListener('contractUpdated', handleContractUpdated);
    };
  }, [leagueId, teamId]);

  // Handlers
  const handleBack = () => {
    router.push(`/leagues/${leagueId}`);
  };

  const handlePlayerAction = (player: PlayerWithContract, action: string) => {
    setSelectedPlayer(player);

    if (action === 'add') {
      // Para adicionar contrato, abrir diretamente o ContractModal
      contractModal.openModal(player.player, team, league);
    } else {
      // Para editar, estender ou tag, abrir o ContractActionsModal
      setShowActionsModal(true);
    }
  };

  const handleContractAction = async (action: string, contractData?: any) => {
    if (!selectedPlayer) return;

    try {
      // Implementar ações de contrato (editar, adicionar, liberar)
      // Aqui seria feita a chamada para a API para executar a ação
      // await fetch(`/api/teams/${teamId}/contracts/${action}`, { ... });

      // Recarregar dados após a ação
      // loadTeamData();
      // Revalidar dados financeiros em tempo real
      revalidateFinancials();

      setShowActionsModal(false);
      setSelectedPlayer(null);
    } catch (error) {
      console.error('Erro ao executar ação de contrato:', error);
    }
  };

  // Estados de carregamento e erro
  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando dados do time...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar dados</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
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

  if (!team || !league) {
    return (
      <div className="flex h-screen bg-background">
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
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header do Time */}
          <TeamHeader
            team={team}
            league={league}
            players={playersWithContracts}
            contracts={contracts}
            deadMoneyRecords={deadMoneyRecords}
            onBack={handleBack}
          />

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <PositionDistributionChart players={playersWithContracts} />
            <CapProjectionChart
              team={team}
              players={playersWithContracts}
              league={league}
              contracts={contracts}
              deadMoneyRecords={deadMoneyRecords}
            />
          </div>

          {/* Seções de Jogadores por Status */}
          <PlayerRosterSections
            players={playersWithContracts}
            onPlayerAction={handlePlayerAction}
            league={league}
          />
        </div>
      </div>

      {/* Modal de Ações de Contrato */}
      <ContractActionsModal
        isOpen={showActionsModal}
        player={selectedPlayer}
        team={team!}
        league={league!}
        onClose={() => {
          setShowActionsModal(false);
          setSelectedPlayer(null);
        }}
        onAction={handleContractAction}
        isCommissioner={isCommissioner}
      />

      {/* Modal de Contrato */}
      <ContractModal
        isOpen={contractModal.isOpen}
        onClose={contractModal.closeModal}
        player={contractModal.player}
        team={contractModal.team}
        league={contractModal.league}
        contract={contractModal.contract}
        onSave={contractModal.saveContract}
        isCommissioner={isCommissioner}
      />
    </div>
  );
}

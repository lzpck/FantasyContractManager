'use client';

/**
 * EXEMPLO DE INTEGRAÇÃO DO MODAL DE CONTRATOS
 *
 * Este arquivo demonstra como integrar o Modal de Contratos
 * em diferentes cenários de uso dentro do sistema.
 */

import { useState, useEffect } from 'react';
import { Player, Team, League, PlayerWithContract } from '@/types';
import { useContractModal, useCanManageContracts } from '@/hooks/useContractModal';
import ContractModal from './ContractModal';
import { PlusIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/utils/formatUtils';
import { getPositionTailwindClasses } from '@/utils/positionColors';

// Dados de exemplo para demonstração
const EXAMPLE_LEAGUE: League = {
  id: 'league-1',
  name: 'Liga Exemplo',
  season: 2024,
  salaryCap: 279000000,
  totalTeams: 12,
  status: 'active' as any,
  commissionerId: 'user-1',
  maxFranchiseTags: 1,
  annualIncreasePercentage: 15,
  minimumSalary: 1000000,
  seasonTurnoverDate: '2024-04-01',
  settings: {} as any,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const EXAMPLE_TEAM: Team = {
  id: 'team-1',
  leagueId: 'league-1',
  ownerId: 'user-1',
  name: 'Time Exemplo',
  abbreviation: 'EX',
  availableCap: 50000000,
  currentDeadMoney: 0,
  nextSeasonDeadMoney: 0,
  franchiseTagsUsed: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const EXAMPLE_PLAYERS: Player[] = [
  {
    id: 'player-1',
    sleeperPlayerId: 'sleeper-1',
    name: 'Josh Allen',
    position: 'QB' as any,
    fantasyPositions: ['QB'] as any,
    nflTeam: 'BUF',
    jerseyNumber: 17,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'player-2',
    sleeperPlayerId: 'sleeper-2',
    name: 'Christian McCaffrey',
    position: 'RB' as any,
    fantasyPositions: ['RB'] as any,
    nflTeam: 'SF',
    jerseyNumber: 23,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'player-3',
    sleeperPlayerId: 'sleeper-3',
    name: 'Cooper Kupp',
    position: 'WR' as any,
    fantasyPositions: ['WR'] as any,
    nflTeam: 'LAR',
    jerseyNumber: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * EXEMPLO 1: Card de Jogador com Botão de Contrato
 */
function PlayerCard({
  player,
  team,
  league,
  contract,
}: {
  player: Player;
  team: Team;
  league: League;
  contract?: any;
}) {
  const contractModal = useContractModal();
  const canManage = useCanManageContracts();

  const handleAddContract = () => {
    contractModal.openModal(player, team, league);
  };

  const handleEditContract = () => {
    contractModal.openModal(player, team, league, contract);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{player.name}</h3>
          <p className="text-sm text-slate-400">
            {player.position} • {player.nflTeam}
          </p>
        </div>
        <div className="text-right">
          {contract ? (
            <>
              <div className="text-sm font-medium text-slate-100">
                {formatCurrency(contract.currentSalary)}
              </div>
              <div className="text-xs text-slate-400">{contract.yearsRemaining} ano(s)</div>
            </>
          ) : (
            <div className="text-sm text-slate-400">Sem contrato</div>
          )}
        </div>
      </div>

      {canManage && (
        <div className="flex space-x-2">
          {contract ? (
            <button
              onClick={handleEditContract}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Editar</span>
            </button>
          ) : (
            <button
              onClick={handleAddContract}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Adicionar</span>
            </button>
          )}
        </div>
      )}

      {/* Modal integrado */}
      <ContractModal
        isOpen={contractModal.isOpen}
        onClose={contractModal.closeModal}
        player={contractModal.player}
        team={contractModal.team}
        league={contractModal.league}
        contract={contractModal.contract}
        onSave={contractModal.saveContract}
        isCommissioner={canManage}
      />
    </div>
  );
}

/**
 * EXEMPLO 2: Tabela de Contratos com Ações
 */
function ContractsTable({
  playersWithContracts,
  team,
  league,
}: {
  playersWithContracts: PlayerWithContract[];
  team: Team;
  league: League;
}) {
  const contractModal = useContractModal();
  const canManage = useCanManageContracts();

  const handleEditContract = (playerWithContract: PlayerWithContract) => {
    contractModal.openModal(
      playerWithContract.player,
      team,
      league,
      playerWithContract.contract || undefined,
    );
  };

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700">
        <h2 className="text-xl font-semibold text-slate-100">Contratos Ativos</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Jogador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Posição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Salário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Anos Restantes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Tipo
              </th>
              {canManage && (
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {playersWithContracts.map(playerWithContract => (
              <tr
                key={playerWithContract.player.id}
                className="hover:bg-slate-700 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-100">
                    {playerWithContract.player.name}
                  </div>
                  <div className="text-sm text-slate-400">{playerWithContract.player.nflTeam}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionTailwindClasses(playerWithContract.player.position)}`}
                  >
                    {playerWithContract.player.position}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                  {playerWithContract.contract
                    ? formatCurrency(playerWithContract.contract.currentSalary)
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                  {playerWithContract.contract
                    ? `${playerWithContract.contract.yearsRemaining} ano(s)`
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                  {playerWithContract.contract ? playerWithContract.contract.acquisitionType : '-'}
                </td>
                {canManage && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditContract(playerWithContract)}
                      className="text-blue-400 hover:text-blue-300 mr-3"
                      title="Editar contrato"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal integrado */}
      <ContractModal
        isOpen={contractModal.isOpen}
        onClose={contractModal.closeModal}
        player={contractModal.player}
        team={contractModal.team}
        league={contractModal.league}
        contract={contractModal.contract}
        onSave={contractModal.saveContract}
        isCommissioner={canManage}
      />
    </div>
  );
}

/**
 * EXEMPLO 3: Dashboard Completo
 */
function ContractsDashboard() {
  const [selectedTab, setSelectedTab] = useState<'players' | 'contracts'>('players');
  const [mockContracts, setMockContracts] = useState<any[]>([]);
  const canManage = useCanManageContracts();

  // Simular alguns contratos existentes
  useEffect(() => {
    setMockContracts([
      {
        id: 'contract-1',
        currentSalary: 45000000,
        yearsRemaining: 3,
        acquisitionType: 'auction',
        status: 'active',
      },
    ]);
  }, []);

  // Escutar atualizações de contratos
  useEffect(() => {
    const handleContractUpdate = (event: any) => {
      console.log('Contrato atualizado:', event.detail);
      // Aqui você recarregaria os dados reais
    };

    window.addEventListener('contractUpdated', handleContractUpdate);
    return () => window.removeEventListener('contractUpdated', handleContractUpdate);
  }, []);

  const playersWithContracts: PlayerWithContract[] = EXAMPLE_PLAYERS.filter(
    (_, index) => index < mockContracts.length,
  ).map((player, index) => ({
    player,
    contract: { ...mockContracts[index], playerId: player.id, teamId: EXAMPLE_TEAM.id },
  }));

  const playersWithoutContracts = EXAMPLE_PLAYERS.filter(
    player => !playersWithContracts.some(pwc => pwc.player.id === player.id),
  );

  if (!canManage) {
    return (
      <div className="bg-slate-800 rounded-xl p-8 text-center">
        <EyeIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-100 mb-2">Acesso Restrito</h2>
        <p className="text-slate-400">Apenas comissários podem gerenciar contratos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Gerenciamento de Contratos</h1>
            <p className="text-slate-400">
              {EXAMPLE_TEAM.name} • {EXAMPLE_LEAGUE.name}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Salary Cap Disponível</div>
            <div className="text-xl font-bold text-green-400">
              {formatCurrency(EXAMPLE_TEAM.availableCap)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('players')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'players'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Jogadores ({EXAMPLE_PLAYERS.length})
            </button>
            <button
              onClick={() => setSelectedTab('contracts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'contracts'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Contratos Ativos ({playersWithContracts.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      {selectedTab === 'players' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {EXAMPLE_PLAYERS.map(player => {
              const contract = mockContracts.find(
                (_, index) => EXAMPLE_PLAYERS[index]?.id === player.id,
              );
              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  team={EXAMPLE_TEAM}
                  league={EXAMPLE_LEAGUE}
                  contract={contract}
                />
              );
            })}
          </div>
        </div>
      )}

      {selectedTab === 'contracts' && (
        <ContractsTable
          playersWithContracts={playersWithContracts}
          team={EXAMPLE_TEAM}
          league={EXAMPLE_LEAGUE}
        />
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="text-sm text-slate-400">Total de Contratos</div>
          <div className="text-2xl font-bold text-slate-100">{playersWithContracts.length}</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="text-sm text-slate-400">Jogadores Livres</div>
          <div className="text-2xl font-bold text-slate-100">{playersWithoutContracts.length}</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="text-sm text-slate-400">Cap Utilizado</div>
          <div className="text-2xl font-bold text-slate-100">
            {formatCurrency(EXAMPLE_LEAGUE.salaryCap - EXAMPLE_TEAM.availableCap)}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * COMPONENTE PRINCIPAL DE EXEMPLO
 */
export default function ExampleIntegration() {
  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Exemplo de Integração - Modal de Contratos
          </h1>
          <p className="text-slate-400">
            Esta página demonstra diferentes formas de integrar o Modal de Contratos no sistema de
            gerenciamento de fantasy football.
          </p>
        </div>

        <ContractsDashboard />
      </div>
    </div>
  );
}

/**
 * NOTAS DE IMPLEMENTAÇÃO:
 *
 * 1. Este exemplo mostra três padrões de integração:
 *    - PlayerCard: Card individual com botão de ação
 *    - ContractsTable: Tabela com ações em linha
 *    - ContractsDashboard: Dashboard completo com tabs
 *
 * 2. Cada componente gerencia seu próprio estado do modal
 *    usando o hook useContractModal()
 *
 * 3. As permissões são verificadas usando useCanManageContracts()
 *
 * 4. O sistema escuta eventos 'contractUpdated' para recarregar dados
 *
 * 5. Os dados são mockados para demonstração, mas a estrutura
 *    é idêntica ao que seria usado com dados reais
 *
 * 6. O modal é integrado em cada componente que precisa dele,
 *    mantendo o estado isolado e reutilizável
 */

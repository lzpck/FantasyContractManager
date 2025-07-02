'use client';

/**
 * GERENCIADOR COMPLETO DE CONTRATOS DE JOGADORES
 *
 * Este componente integra a tabela de jogadores com contratos
 * e o modal de ações, fornecendo uma solução completa para
 * gerenciamento de contratos.
 */

import { useState, useEffect } from 'react';
import { PlayerWithContract, Team, League, ContractStatus } from '@/types';
import { PlayerContractsTable } from './PlayerContractsTable';
import ContractActionsModal from './ContractActionsModal';
import { useAuth } from '@/hooks/useAuth';
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';

interface PlayerContractsManagerProps {
  /** Lista de jogadores com contratos */
  players: PlayerWithContract[];
  /** Informações do time */
  team: Team;
  /** Informações da liga */
  league: League;
  /** Função chamada quando contratos são atualizados */
  onContractsUpdate?: () => void;
  /** Título personalizado */
  title?: string;
  /** Mostrar estatísticas do salary cap */
  showCapStats?: boolean;
}

/**
 * Componente principal para gerenciar contratos de jogadores
 *
 * Integra tabela de jogadores, modal de ações e estatísticas
 * do salary cap em uma interface unificada.
 */
export function PlayerContractsManager({
  players,
  team,
  league,
  onContractsUpdate,
  title = 'Contratos de Jogadores',
  showCapStats = true,
}: PlayerContractsManagerProps) {
  // Estados para filtros e ordenação
  const [sortBy, setSortBy] = useState<'name' | 'position' | 'salary' | 'yearsRemaining'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Estados para o modal de ações
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithContract | null>(null);

  // Hook de autenticação
  const { user } = useAuth();
  const isCommissioner = user?.role === 'COMMISSIONER';

  // Filtrar e ordenar jogadores
  const filteredAndSortedPlayers = players
    .filter(playerWithContract => {
      const { player, contract } = playerWithContract;

      // Filtro por texto (nome ou time NFL)
      if (filterText) {
        const searchText = filterText.toLowerCase();
        const matchesName = player.name.toLowerCase().includes(searchText);
        const matchesTeam = player.nflTeam?.toLowerCase().includes(searchText);
        if (!matchesName && !matchesTeam) return false;
      }

      // Filtro por posição
      if (filterPosition !== 'all' && player.position !== filterPosition) {
        return false;
      }

      // Filtro por status (simulado - você pode ajustar conforme sua lógica)
      if (filterStatus !== 'all') {
        // Aqui você pode implementar a lógica de status baseada em suas regras
        // Por exemplo: active = tem contrato ativo, ir = injured reserve, etc.
        if (filterStatus === 'active' && (!contract || contract.status !== ContractStatus.ACTIVE)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

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
          aValue = a.contract?.currentSalary || 0;
          bValue = b.contract?.currentSalary || 0;
          break;
        case 'yearsRemaining':
          aValue = a.contract?.yearsRemaining || 0;
          bValue = b.contract?.yearsRemaining || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Função para alterar ordenação
  const handleSortChange = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Função para lidar com ações de jogadores
  const handlePlayerAction = (playerWithContract: PlayerWithContract, action: string) => {
    setSelectedPlayer(playerWithContract);
    setIsActionsModalOpen(true);
  };

  // Função para processar ações do modal
  const handleModalAction = async (action: string, data: any) => {
    try {
      console.log('Processando ação:', action, data);

      // Aqui você implementaria a lógica para cada ação
      switch (action) {
        case 'edit':
          // Lógica para editar contrato (já integrada no modal)
          break;
        case 'extend':
          // Lógica para extensão de contrato
          await handleContractExtension(data);
          break;
        case 'tag':
          // Lógica para franchise tag
          await handleFranchiseTag(data);
          break;
        case 'cut':
          // Lógica para cortar jogador
          await handleCutPlayer(data);
          break;
        default:
          console.warn('Ação não reconhecida:', action);
      }

      // Atualizar dados após ação
      if (onContractsUpdate) {
        onContractsUpdate();
      }
    } catch (error) {
      console.error('Erro ao processar ação:', error);
      toast.error('Erro ao processar ação. Tente novamente.');
    }
  };

  // Funções para processar ações específicas
  const handleContractExtension = async (data: any) => {
    // Implementar lógica de extensão
    console.log('Aplicando extensão de contrato:', data);
    // Aqui você faria a chamada para a API
  };

  const handleFranchiseTag = async (data: any) => {
    // Implementar lógica de franchise tag
    console.log('Aplicando franchise tag:', data);
    // Aqui você faria a chamada para a API
  };

  const handleCutPlayer = async (data: any) => {
    // Implementar lógica para cortar jogador
    console.log('Cortando jogador:', data);
    // Aqui você faria a chamada para a API
  };

  // Calcular estatísticas do salary cap
  const totalSalaries = players.reduce((total, p) => {
    return total + (p.contract?.currentSalary || 0);
  }, 0);

  const availableCap = league.salaryCap - totalSalaries;
  const capUsagePercentage = (totalSalaries / league.salaryCap) * 100;

  // Escutar atualizações de contratos
  useEffect(() => {
    const handleContractUpdate = () => {
      if (onContractsUpdate) {
        onContractsUpdate();
      }
    };

    window.addEventListener('contractUpdated', handleContractUpdate);
    return () => window.removeEventListener('contractUpdated', handleContractUpdate);
  }, [onContractsUpdate]);

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
            <p className="text-slate-400">
              {team.name} • {league.name} • Temporada {league.season}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-sm text-slate-400">Jogadores</div>
              <div className="text-xl font-bold text-slate-100 flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-1" />
                {players.length}
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas do Salary Cap */}
        {showCapStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-400">Salary Cap Total</div>
              <div className="text-lg font-bold text-slate-100">
                {formatCurrency(league.salaryCap)}
              </div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-400">Cap Utilizado</div>
              <div className="text-lg font-bold text-slate-100">
                {formatCurrency(totalSalaries)}
              </div>
              <div className="text-xs text-slate-400">{capUsagePercentage.toFixed(1)}% do cap</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-400">Cap Disponível</div>
              <div
                className={`text-lg font-bold ${
                  availableCap < 0 ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {formatCurrency(availableCap)}
              </div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-sm text-slate-400">Dead Money</div>
              <div className="text-lg font-bold text-red-400">
                {formatCurrency(team.currentDeadMoney || 0)}
              </div>
            </div>
          </div>
        )}

        {/* Barra de Progresso do Cap */}
        {showCapStats && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-400 mb-1">
              <span>Uso do Salary Cap</span>
              <span>{capUsagePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  capUsagePercentage > 100
                    ? 'bg-red-500'
                    : capUsagePercentage > 90
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(capUsagePercentage, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Jogadores */}
      <PlayerContractsTable
        players={players}
        sortBy={sortBy}
        sortOrder={sortOrder}
        filterText={filterText}
        filterPosition={filterPosition}
        filterStatus={filterStatus}
        onSortChange={handleSortChange}
        onFilterTextChange={setFilterText}
        onFilterPositionChange={setFilterPosition}
        onFilterStatusChange={setFilterStatus}
        onPlayerAction={handlePlayerAction}
        isCommissioner={isCommissioner}
      />

      {/* Modal de Ações */}
      <ContractActionsModal
        isOpen={isActionsModalOpen}
        onClose={() => {
          setIsActionsModalOpen(false);
          setSelectedPlayer(null);
        }}
        player={selectedPlayer}
        team={team}
        league={league}
        onAction={handleModalAction}
        isCommissioner={isCommissioner}
      />
    </div>
  );
}

/**
 * EXEMPLO DE USO:
 *
 * ```tsx
 * import { PlayerContractsManager } from '@/components/teams/PlayerContractsManager';
 *
 * function TeamPage() {
 *   const { players, team, league, refreshContracts } = useTeamData();
 *
 *   return (
 *     <PlayerContractsManager
 *       players={players}
 *       team={team}
 *       league={league}
 *       onContractsUpdate={refreshContracts}
 *       title="Elenco do Time"
 *       showCapStats={true}
 *     />
 *   );
 * }
 * ```
 */

export default PlayerContractsManager;

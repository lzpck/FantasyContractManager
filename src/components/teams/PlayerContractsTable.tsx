'use client';

import { PlayerWithContract, ContractStatus, Contract } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';
import { getPositionTailwindClasses } from '@/utils/positionColors';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface PlayerContractsTableProps {
  /** Lista de jogadores com contratos */
  players: PlayerWithContract[];
  /** Campo de ordenação atual */
  sortBy: 'name' | 'position' | 'salary' | 'yearsRemaining';
  /** Ordem de ordenação atual */
  sortOrder: 'asc' | 'desc';
  /** Texto do filtro */
  filterText: string;
  /** Posição filtrada */
  filterPosition: string;
  /** Status filtrado */
  filterStatus: string;
  /** Função chamada ao alterar ordenação */
  onSortChange: (field: 'name' | 'position' | 'salary' | 'yearsRemaining') => void;
  /** Função chamada ao alterar filtro de texto */
  onFilterTextChange: (text: string) => void;
  /** Função chamada ao alterar filtro de posição */
  onFilterPositionChange: (position: string) => void;
  /** Função chamada ao alterar filtro de status */
  onFilterStatusChange: (status: string) => void;
  /** Função chamada ao executar ação em jogador */
  onPlayerAction: (player: PlayerWithContract, action: string) => void;
  /** Se o usuário é comissário (pode editar contratos) */
  isCommissioner: boolean;
}

/**
 * Componente de tabela de jogadores com contratos
 *
 * Exibe lista completa de jogadores do time com informações
 * de contrato, filtros, ordenação e ações disponíveis.
 */
export function PlayerContractsTable({
  players,
  sortBy,
  sortOrder,
  filterText,
  filterPosition,
  filterStatus,
  onSortChange,
  onFilterTextChange,
  onFilterPositionChange,
  onFilterStatusChange,
  onPlayerAction,
  isCommissioner,
}: PlayerContractsTableProps) {
  // Função para calcular dead money estimado
  const calculateDeadMoney = (contract: Contract) => {
    const remainingSalary = contract.currentSalary * contract.yearsRemaining;
    return remainingSalary * 0.25; // 25% do salário restante
  };

  // Função para obter cor do status do contrato
  const getContractStatusColor = (status: ContractStatus, yearsRemaining: number) => {
    if (yearsRemaining === 1) return 'bg-red-100 text-red-800'; // Último ano - vermelho
    // Se o contrato tem 0 anos restantes, usa cor específica para expirado
    if (yearsRemaining === 0) {
      return 'bg-orange-100 text-orange-800';
    }
    if (status === ContractStatus.ACTIVE) return 'bg-green-100 text-green-800';
    if (status === ContractStatus.TAGGED) return 'bg-purple-100 text-purple-800';
    if (status === ContractStatus.EXTENDED) return 'bg-blue-100 text-blue-800';
    return 'bg-slate-700 text-slate-100';
  };

  // Função para obter texto do status do contrato
  const getContractStatusText = (status: ContractStatus, yearsRemaining: number) => {
    if (yearsRemaining === 1) return 'Último Ano';
    // Se o contrato tem 0 anos restantes, mostra como "Expirado"
    if (yearsRemaining === 0) {
      return 'Expirado';
    }
    switch (status) {
      case ContractStatus.ACTIVE:
        return 'Ativo';
      case ContractStatus.TAGGED:
        return 'Franchise Tag';
      case ContractStatus.EXTENDED:
        return 'Estendido';
      default:
        return 'Ativo';
    }
  };

  // Função para verificar se jogador é elegível para extensão
  const isEligibleForExtension = (contract: Contract | null) => {
    return contract && contract.yearsRemaining === 1 && !contract.hasBeenExtended;
  };

  // Função para verificar se jogador é elegível para franchise tag
  const isEligibleForTag = (contract: Contract | null) => {
    return contract && contract.yearsRemaining === 1 && !contract.hasBeenTagged;
  };

  // Obter posições únicas para o filtro
  const uniquePositions = Array.from(new Set(players.map(p => p.player.position))).sort();

  // Componente de cabeçalho ordenável
  const SortableHeader = ({
    field,
    children,
  }: {
    field: typeof sortBy;
    children: React.ReactNode;
  }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700"
      onClick={() => onSortChange(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortBy === field &&
          (sortOrder === 'asc' ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          ))}
      </div>
    </th>
  );

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700">
      {/* Filtros */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-slate-100 mb-2">
              Buscar Jogador
            </label>
            <input
              type="text"
              id="search"
              placeholder="Nome do jogador ou time NFL..."
              value={filterText}
              onChange={e => onFilterTextChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-800 text-slate-100 placeholder-slate-500"
            />
          </div>
          <div className="sm:w-48">
            <label htmlFor="position" className="block text-sm font-medium text-slate-100 mb-2">
              Filtrar por Posição
            </label>
            <select
              id="position"
              value={filterPosition}
              onChange={e => onFilterPositionChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-800 text-slate-100"
            >
              <option value="all">Todas as Posições</option>
              {uniquePositions.map(position => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <label htmlFor="status" className="block text-sm font-medium text-slate-100 mb-2">
              Filtrar por Status
            </label>
            <select
              id="status"
              value={filterStatus}
              onChange={e => onFilterStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-800 text-slate-100"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Elenco Ativo</option>
              <option value="ir">IR (Injured Reserve)</option>
              <option value="taxi">Taxi Squad</option>
            </select>
          </div>
        </div>
        {(filterText || filterPosition !== 'all' || filterStatus !== 'all') && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Mostrando {players.length} jogador(es)
              {filterText && ` com &quot;${filterText}&quot;`}
              {filterPosition !== 'all' && ` na posição ${filterPosition}`}
              {filterStatus !== 'all' &&
                ` com status ${filterStatus === 'active' ? 'Ativo' : filterStatus === 'ir' ? 'IR' : 'Taxi Squad'}`}
            </p>
            <button
              onClick={() => {
                onFilterTextChange('');
                onFilterPositionChange('all');
                onFilterStatusChange('all');
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-900">
            <tr>
              <SortableHeader field="name">Jogador</SortableHeader>
              <SortableHeader field="position">Posição</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Time NFL
              </th>
              <SortableHeader field="salary">Salário Atual</SortableHeader>
              <SortableHeader field="yearsRemaining">Anos Restantes</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Dead Money
              </th>
              {isCommissioner && (
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
            {players.length === 0 ? (
              <tr>
                <td colSpan={isCommissioner ? 8 : 7} className="px-6 py-12 text-center">
                  <div className="text-slate-400">
                    <p className="text-lg font-medium mb-2">Nenhum jogador encontrado</p>
                    <p className="text-sm">
                      {filterText || filterPosition !== 'all'
                        ? 'Tente ajustar os filtros de busca.'
                        : 'Este time ainda não possui jogadores contratados.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              players.map(playerWithContract => {
                const { player, contract } = playerWithContract;
                const deadMoney = contract ? calculateDeadMoney(contract) : 0;
                const statusColor = contract
                  ? getContractStatusColor(contract.status, contract.yearsRemaining)
                  : 'bg-gray-100 text-gray-800';
                const statusText = contract
                  ? getContractStatusText(contract.status, contract.yearsRemaining)
                  : 'Sem contrato';

                return (
                  <tr key={player.id} className="hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-100">{player.name}</div>
                        {player.jerseyNumber && (
                          <div className="text-sm text-slate-400">#{player.jerseyNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionTailwindClasses(player.position)}`}
                      >
                        {player.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                      {player.nflTeam}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                      {contract ? formatCurrency(contract.currentSalary) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                      {contract ? `${contract.yearsRemaining} ano(s)` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
                      >
                        {statusText}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                      {contract ? formatCurrency(deadMoney) : '-'}
                    </td>
                    {isCommissioner && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* Editar Contrato */}
                          <button
                            onClick={() => onPlayerAction(playerWithContract, 'edit')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar Contrato"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>

                          {/* Extensão (se elegível) */}
                          {isEligibleForExtension(contract) && (
                            <button
                              onClick={() => onPlayerAction(playerWithContract, 'extend')}
                              className="text-green-600 hover:text-green-900"
                              title="Extensão de Contrato"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                            </button>
                          )}

                          {/* Franchise Tag (se elegível) */}
                          {isEligibleForTag(contract) && (
                            <button
                              onClick={() => onPlayerAction(playerWithContract, 'tag')}
                              className="text-purple-600 hover:text-purple-900"
                              title="Franchise Tag"
                            >
                              <TagIcon className="h-4 w-4" />
                            </button>
                          )}

                          {/* Cortar Jogador */}
                          <button
                            onClick={() => onPlayerAction(playerWithContract, 'cut')}
                            className="text-red-600 hover:text-red-900"
                            title="Cortar Jogador"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

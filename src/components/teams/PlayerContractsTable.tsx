'use client';

import { PlayerWithContract, ContractStatus, Contract } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';
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
  /** Função chamada ao alterar ordenação */
  onSortChange: (field: 'name' | 'position' | 'salary' | 'yearsRemaining') => void;
  /** Função chamada ao alterar filtro de texto */
  onFilterTextChange: (text: string) => void;
  /** Função chamada ao alterar filtro de posição */
  onFilterPositionChange: (position: string) => void;
  /** Função chamada ao executar ação em jogador */
  onPlayerAction: (player: PlayerWithContract, action: string) => void;
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
  onSortChange,
  onFilterTextChange,
  onFilterPositionChange,
  onPlayerAction,
}: PlayerContractsTableProps) {
  // Função para calcular dead money estimado
  const calculateDeadMoney = (contract: Contract) => {
    const remainingSalary = contract.currentSalary * contract.yearsRemaining;
    return remainingSalary * 0.25; // 25% do salário restante
  };

  // Função para obter cor do status do contrato
  const getContractStatusColor = (status: ContractStatus, yearsRemaining: number) => {
    if (yearsRemaining === 1) return 'bg-yellow-100 text-yellow-800';
    if (status === ContractStatus.ACTIVE) return 'bg-green-100 text-green-800';
    if (status === ContractStatus.TAGGED) return 'bg-purple-100 text-purple-800';
    if (status === ContractStatus.EXTENDED) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Função para obter texto do status do contrato
  const getContractStatusText = (status: ContractStatus, yearsRemaining: number) => {
    if (yearsRemaining === 1) return 'Último Ano';
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
  const isEligibleForExtension = (contract: Contract) => {
    return contract.yearsRemaining === 1 && !contract.hasBeenExtended;
  };

  // Função para verificar se jogador é elegível para franchise tag
  const isEligibleForTag = (contract: Contract) => {
    return contract.yearsRemaining === 1 && !contract.hasBeenTagged;
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
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Filtros */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Jogador
            </label>
            <input
              type="text"
              id="search"
              placeholder="Nome do jogador ou time NFL..."
              value={filterText}
              onChange={e => onFilterTextChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="sm:w-48">
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Posição
            </label>
            <select
              id="position"
              value={filterPosition}
              onChange={e => onFilterPositionChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas as Posições</option>
              {uniquePositions.map(position => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(filterText || filterPosition !== 'all') && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {players.length} jogador(es)
              {filterText && ` com &quot;${filterText}&quot;`}
              {filterPosition !== 'all' && ` na posição ${filterPosition}`}
            </p>
            <button
              onClick={() => {
                onFilterTextChange('');
                onFilterPositionChange('all');
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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader field="name">Jogador</SortableHeader>
              <SortableHeader field="position">Posição</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time NFL
              </th>
              <SortableHeader field="salary">Salário Atual</SortableHeader>
              <SortableHeader field="yearsRemaining">Anos Restantes</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dead Money
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {players.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="text-gray-500">
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
                const deadMoney = calculateDeadMoney(contract);
                const statusColor = getContractStatusColor(
                  contract.status,
                  contract.yearsRemaining,
                );
                const statusText = getContractStatusText(contract.status, contract.yearsRemaining);

                return (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{player.name}</div>
                        {player.jerseyNumber && (
                          <div className="text-sm text-gray-500">#{player.jerseyNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {player.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.nflTeam}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(contract.currentSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contract.yearsRemaining} ano(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
                      >
                        {statusText}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(deadMoney)}
                    </td>
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

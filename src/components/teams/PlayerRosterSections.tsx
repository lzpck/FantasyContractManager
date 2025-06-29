import React from 'react';
import { PlayerWithContract, PlayerRosterStatus } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';
import { PencilIcon, PlusIcon, ArrowPathIcon, TagIcon } from '@heroicons/react/24/outline';

interface PlayerRosterSectionsProps {
  /** Lista de jogadores com contratos */
  players: PlayerWithContract[];
  /** Função chamada ao executar ação em jogador */
  onPlayerAction: (player: PlayerWithContract, action: string) => void;
}

/**
 * Componente que exibe jogadores separados por status do roster
 *
 * Organiza os jogadores em quatro seções:
 * - Jogadores Ativos
 * - Injured Reserve (IR)
 * - Taxi Squad (TS)
 * - Jogadores Cortados
 */
export function PlayerRosterSections({ players, onPlayerAction }: PlayerRosterSectionsProps) {
  // Função para verificar se jogador é elegível para extensão
  const isEligibleForExtension = (contract: any) => {
    return contract && contract.yearsRemaining === 1 && !contract.hasBeenExtended;
  };

  // Função para verificar se jogador é elegível para franchise tag
  const isEligibleForTag = (contract: any) => {
    return contract && contract.yearsRemaining === 1 && !contract.hasBeenTagged;
  };

  // Função para obter cor do status do contrato
  const getContractStatusColor = (status: string, yearsRemaining: number) => {
    if (status === 'ACTIVE' || status === 'active') {
      if (yearsRemaining <= 1) return 'bg-red-100 text-red-800'; // Último ano - vermelho
      if (yearsRemaining <= 2) return 'bg-yellow-100 text-yellow-800'; // Expira em breve - amarelo
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Função para obter texto do status do contrato
  const getContractStatusText = (status: string, yearsRemaining: number) => {
    if (status === 'ACTIVE' || status === 'active') {
      if (yearsRemaining <= 1) return 'Último ano';
      if (yearsRemaining <= 2) return 'Expira em breve';
      return 'Ativo';
    }
    return 'Inativo';
  };

  // Função para calcular dead money
  const calculateDeadMoney = (contract: any) => {
    if (!contract) return 0;
    // Lógica simplificada - pode ser expandida conforme as regras
    return contract.currentSalary * 0.25;
  };

  // Ordem das posições conforme especificado
  const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB'];

  // Função para ordenar jogadores por posição
  const sortPlayersByPosition = (players: PlayerWithContract[]) => {
    return players.sort((a, b) => {
      const positionA = a.player.fantasyPositions?.[0] || a.player.position;
      const positionB = b.player.fantasyPositions?.[0] || b.player.position;

      const indexA = POSITION_ORDER.indexOf(positionA);
      const indexB = POSITION_ORDER.indexOf(positionB);

      // Se a posição não estiver na lista, colocar no final
      const orderA = indexA === -1 ? POSITION_ORDER.length : indexA;
      const orderB = indexB === -1 ? POSITION_ORDER.length : indexB;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Se as posições forem iguais, ordenar por nome
      return a.player.name.localeCompare(b.player.name);
    });
  };

  // Separar jogadores por status e ordenar por posição
  const activePlayers = sortPlayersByPosition(players.filter(p => p.rosterStatus === 'active'));
  const irPlayers = sortPlayersByPosition(players.filter(p => p.rosterStatus === 'ir'));
  const taxiPlayers = sortPlayersByPosition(players.filter(p => p.rosterStatus === 'taxi'));
  const cutPlayers = sortPlayersByPosition(players.filter(p => p.rosterStatus === 'cut'));

  // Componente para renderizar uma seção de jogadores
  const PlayerSection = ({
    title,
    players: sectionPlayers,
    emptyMessage,
  }: {
    title: string;
    players: PlayerWithContract[];
    emptyMessage: string;
  }) => (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-400">{sectionPlayers.length} jogador(es)</span>

          </div>
        </div>
      </div>

      {sectionPlayers.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-slate-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Jogador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Posição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Time NFL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Salário Atual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Anos Restantes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Dead Money
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {sectionPlayers.map(playerWithContract => {
                const { player, contract } = playerWithContract;
                const deadMoney = contract ? calculateDeadMoney(contract) : 0;
                const statusColor = contract
                  ? getContractStatusColor(contract.status, contract.yearsRemaining)
                  : 'bg-gray-100 text-gray-800';
                const statusText = contract
                  ? getContractStatusText(contract.status, contract.yearsRemaining)
                  : 'Sem contrato';

                // Usar fantasyPositions para exibir posições
                const displayPositions =
                  player.fantasyPositions && player.fantasyPositions.length > 0
                    ? player.fantasyPositions.join(', ')
                    : player.position;

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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {displayPositions}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 relative z-10">
                        {/* Adicionar/Editar Contrato */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                  
                            onPlayerAction(playerWithContract, contract ? 'edit' : 'add');
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100 cursor-pointer relative z-20"
                          title={contract ? 'Editar Contrato' : 'Adicionar Contrato'}
                        >
                          {contract ? (
                            <PencilIcon className="h-4 w-4" />
                          ) : (
                            <PlusIcon className="h-4 w-4" />
                          )}
                        </button>

                        {/* Extensão (se elegível) */}
                        {isEligibleForExtension(contract) && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                  
                              onPlayerAction(playerWithContract, 'extend');
                            }}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-100 cursor-pointer relative z-20"
                            title="Extensão de Contrato"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </button>
                        )}

                        {/* Franchise Tag */}
                        {isEligibleForTag(playerWithContract) && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                  
                              onPlayerAction(playerWithContract, 'tag');
                            }}
                            className="text-purple-600 hover:text-purple-900 ml-2 p-1 rounded hover:bg-purple-100 cursor-pointer relative z-20"
                            title="Franchise Tag"
                          >
                            <TagIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Jogadores Ativos */}
      <PlayerSection
        title="Jogadores Ativos"
        players={activePlayers}
        emptyMessage="Nenhum jogador ativo no momento."
      />

      {/* Injured Reserve */}
      <PlayerSection
        title="Injured Reserve (IR)"
        players={irPlayers}
        emptyMessage="Nenhum jogador na IR."
      />

      {/* Taxi Squad */}
      <PlayerSection
        title="Taxi Squad (TS)"
        players={taxiPlayers}
        emptyMessage="Nenhum jogador no Taxi Squad."
      />

      {/* Jogadores Cortados */}
      <PlayerSection
        title="Jogadores Cortados"
        players={cutPlayers}
        emptyMessage="Nenhum jogador cortado."
      />
    </div>
  );
}

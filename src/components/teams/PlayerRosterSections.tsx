import React from 'react';
import { PlayerWithContract, PlayerRosterStatus, League, DeadMoneyConfig } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';
import { getPositionTailwindClasses } from '@/utils/positionColors';
import { PencilIcon, PlusIcon, ArrowPathIcon, TagIcon } from '@heroicons/react/24/outline';

interface PlayerRosterSectionsProps {
  /** Lista de jogadores com contratos */
  players: PlayerWithContract[];
  /** Função chamada ao executar ação em jogador */
  onPlayerAction: (player: PlayerWithContract, action: string) => void;
  /** Dados da liga (incluindo configuração de dead money) */
  league: League | null;
  /** Se o usuário é comissário (pode editar contratos) */
  isCommissioner?: boolean;
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
export function PlayerRosterSections({
  players,
  onPlayerAction,
  league,
  isCommissioner = false,
}: PlayerRosterSectionsProps) {
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
    if (status === 'ACTIVE') {
      if (yearsRemaining <= 1) return 'bg-red-100 text-red-800'; // Último ano - vermelho
      if (yearsRemaining <= 2) return 'bg-yellow-100 text-yellow-800'; // Expira em breve - amarelo
      return 'bg-green-100 text-green-800';
    }
    // Se o contrato tem 0 anos restantes, usa cor específica para expirado
    if (yearsRemaining === 0) {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Função para obter texto do status do contrato
  const getContractStatusText = (status: string, yearsRemaining: number) => {
    if (status === 'ACTIVE') {
      if (yearsRemaining <= 1) return 'Último ano';
      if (yearsRemaining <= 2) return 'Expira em breve';
      return 'Ativo';
    }
    // Se o contrato tem 0 anos restantes, mostra como "Expirado"
    if (yearsRemaining === 0) {
      return 'Expirado';
    }
    return 'Expirado';
  };

  /**
   * Simula o cálculo de dead money atual e futuro para um jogador
   * @param contract - Contrato do jogador
   * @param leagueDeadMoneyConfig - Configuração de dead money da liga
   * @param currentYear - Ano atual
   * @returns Objeto com deadMoneyCurrent e deadMoneyNext
   */
  const simulateDeadMoney = (
    contract: any,
    leagueDeadMoneyConfig: DeadMoneyConfig | undefined,
    currentYear: number,
  ) => {
    if (!contract) return { deadMoneyCurrent: 0, deadMoneyNext: 0 };

    // Dead money atual: salário atual × percentual da temporada atual
    const currentSeasonPercent = leagueDeadMoneyConfig?.currentSeason ?? 1;
    const deadMoneyCurrent = contract.currentSalary * currentSeasonPercent;

    // Dead money próximo ano
    let deadMoneyNext = 0;
    const yearsRemaining = contract.yearsRemaining;

    if (yearsRemaining >= 1) {
      // Usa o percentual de aumento anual da liga (padrão 15% se não configurado)
      const annualIncreaseRate = 1 + (league?.annualIncreasePercentage ?? 15) / 100;

      // Projeta salário do próximo ano com aumento anual configurado
      const nextYearSalary = contract.currentSalary * annualIncreaseRate;

      // Usa o percentual baseado nos anos restantes do contrato
      // Se o jogador tem 3 anos restantes, usa o percentual para "3" anos
      const yearsKey = Math.min(yearsRemaining, 4).toString() as '1' | '2' | '3' | '4'; // Máximo 4 anos
      const nextYearPercent = leagueDeadMoneyConfig?.futureSeasons?.[yearsKey] ?? 0;

      deadMoneyNext = nextYearSalary * nextYearPercent;
    }

    return {
      deadMoneyCurrent,
      deadMoneyNext,
    };
  };

  // Ordem das posições conforme especificado
  const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB'];

  // Função para ordenar jogadores por posição
  const sortPlayersByPosition = (players: PlayerWithContract[]) => {
    return players.sort((a, b) => {
      // Função para obter primeira posição (tratando string ou array)
      const getFirstPosition = (player: any) => {
        if (player.fantasyPositions) {
          if (Array.isArray(player.fantasyPositions)) {
            return player.fantasyPositions[0] || player.position;
          } else if (
            typeof player.fantasyPositions === 'string' &&
            player.fantasyPositions.trim() !== ''
          ) {
            return player.fantasyPositions.split(',')[0]?.trim() || player.position;
          }
        }
        return player.position;
      };

      const positionA = getFirstPosition(a.player);
      const positionB = getFirstPosition(b.player);

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
                  Salário Atual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Anos Restantes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Dead Money (Agora)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Dead Money (Próx. Temp.)
                </th>
                {isCommissioner && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {sectionPlayers.map(playerWithContract => {
                const { player, contract } = playerWithContract;
                const { deadMoneyCurrent, deadMoneyNext } = contract
                  ? simulateDeadMoney(
                      contract,
                      league?.deadMoneyConfig as DeadMoneyConfig | undefined,
                      league?.season || new Date().getFullYear(),
                    )
                  : { deadMoneyCurrent: 0, deadMoneyNext: 0 };
                const statusColor = contract
                  ? getContractStatusColor(contract.status, contract.yearsRemaining)
                  : 'bg-gray-100 text-gray-800';
                const statusText = contract
                  ? getContractStatusText(contract.status, contract.yearsRemaining)
                  : 'Sem contrato';

                // Função para tratar fantasyPositions (pode ser string ou array)
                const getDisplayPositions = (player: any) => {
                  let positions: string[] = [];

                  if (player.fantasyPositions) {
                    // Se fantasyPositions é array, usa diretamente
                    if (Array.isArray(player.fantasyPositions)) {
                      positions = player.fantasyPositions.filter(
                        (pos: string) => pos && pos.trim() !== '',
                      );
                    }
                    // Se fantasyPositions é string, converte para array
                    else if (
                      typeof player.fantasyPositions === 'string' &&
                      player.fantasyPositions.trim() !== ''
                    ) {
                      positions = player.fantasyPositions
                        .split(',')
                        .map((pos: string) => pos.trim())
                        .filter((pos: string) => pos !== '');
                    }
                  }

                  // Se não há posições fantasy válidas, usa position como fallback
                  if (positions.length === 0) {
                    positions = [player.position];
                  }

                  return positions;
                };

                const getFirstPosition = (player: any) => {
                  const positions = getDisplayPositions(player);
                  return positions.length > 0 ? positions[0] : 'N/A';
                };

                const displayPositionsText = getDisplayPositions(player).join(', ');
                const firstPosition = getFirstPosition(player);

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
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionTailwindClasses(firstPosition)}`}
                      >
                        {displayPositionsText}
                      </span>
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
                      {contract ? formatCurrency(deadMoneyCurrent) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                      {deadMoneyNext > 0 ? formatCurrency(deadMoneyNext) : '--'}
                    </td>
                    {isCommissioner && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 relative z-10">
                          {/* Adicionar/Editar Contrato */}
                          <button
                            onClick={e => {
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
                              onClick={e => {
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
                              onClick={e => {
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
                    )}
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

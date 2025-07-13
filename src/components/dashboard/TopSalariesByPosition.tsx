import React, { useState, useEffect } from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { getPositionTailwindClasses } from '@/utils/positionColors';

interface Player {
  id: string;
  name: string;
  position: string;
  fantasyPositions?: string[];
  team: string;
  salary: number;
}

interface PositionData {
  position: string;
  players: Player[];
}

interface TopSalariesByPositionProps {
  /** Dados agrupados por posição */
  positionData: PositionData[];
  /** Título do componente */
  title?: string;
  /** Número máximo de jogadores por posição */
  maxPlayersPerPosition?: number;
}

/**
 * Componente para exibir os maiores salários por posição com sistema de abas
 *
 * Regra de negócio:
 * - Exibe os top 3 jogadores com maiores salários por posição (QB, RB, WR, TE, etc.)
 * - Agrupa por fantasyPositions e ordena por valor do salário dentro de cada posição
 * - Formatação em milhões de dólares
 * - Sistema de abas para organizar múltiplas posições
 * - Layout responsivo e otimizado
 *
 * Funcionalidades:
 * - Abas clicáveis para navegar entre posições
 * - Cores específicas por posição
 * - Indicador visual da aba ativa
 * - Fallback para quando não há dados
 */
export function TopSalariesByPosition({
  positionData = [],
  title = 'Top 3 por Posição',
  maxPlayersPerPosition = 3,
}: TopSalariesByPositionProps) {
  // Ordem padrão das posições
  const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB'];

  // Ordenar dados por posição
  const sortedPositionData = [...positionData].sort((a, b) => {
    const posA = positionOrder.indexOf(a.position);
    const posB = positionOrder.indexOf(b.position);

    // Se ambas as posições estão na lista, ordenar por posição
    if (posA !== -1 && posB !== -1) {
      return posA - posB;
    }
    // Se apenas uma está na lista, ela vem primeiro
    else if (posA !== -1) return -1;
    else if (posB !== -1) return 1;

    // Se nenhuma está na lista, ordenar alfabeticamente
    return a.position.localeCompare(b.position);
  });

  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState<string>('');

  // Definir a primeira posição como aba ativa quando os dados mudarem
  useEffect(() => {
    if (sortedPositionData.length > 0 && !activeTab) {
      setActiveTab(sortedPositionData[0].position);
    }
  }, [sortedPositionData, activeTab]);

  // Calcular jogadores da aba ativa
  const activePositionData = sortedPositionData.find(pos => pos.position === activeTab);
  const displayPlayers = activePositionData
    ? activePositionData.players.slice(0, maxPlayersPerPosition)
    : [];

  return (
    <div
      className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-4 sm:p-6 h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:border-slate-600"
      data-testid="top-salaries-by-position-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-900/30 rounded-lg">
            <UserGroupIcon className="h-5 w-5 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <div className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-full">
          {positionData.length} {positionData.length === 1 ? 'posição' : 'posições'}
        </div>
      </div>

      {/* Sistema de Abas */}
      {positionData.length > 0 ? (
        <>
          {/* Navegação das Abas */}
          <div className="flex flex-wrap gap-1 mb-4 p-1 bg-slate-700 rounded-lg flex-shrink-0">
            {sortedPositionData.map(position => {
              const isActive = activeTab === position.position;
              const colorClasses = getPositionTailwindClasses(position.position);

              return (
                <button
                  key={position.position}
                  onClick={() => setActiveTab(position.position)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    isActive
                      ? `${colorClasses} ring-2 ring-offset-2 ring-offset-slate-800`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-600'
                  }`}
                  title={`${position.players.length} jogador${position.players.length !== 1 ? 'es' : ''}`}
                >
                  {position.position}
                  <span className="ml-1 text-xs opacity-75">({position.players.length})</span>
                </button>
              );
            })}
          </div>

          {/* Conteúdo da Aba Ativa - área flexível */}
          <div className="flex-1 flex flex-col">
            {displayPlayers.length > 0 ? (
              <div className="space-y-3 flex-1">
                {displayPlayers.map((player, index) => {
                  const maxSalary = activePositionData?.players[0]?.salary || 1;
                  const percentage = (player.salary / maxSalary) * 100;

                  return (
                    <div
                      key={player.id}
                      className="p-3 bg-slate-700 rounded-lg border border-slate-600 hover:bg-slate-650 hover:border-slate-500 transition-all duration-200 hover:scale-[1.01]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                              index === 0
                                ? 'bg-yellow-500 text-slate-900'
                                : index === 1
                                  ? 'bg-slate-400 text-slate-900'
                                  : index === 2
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-slate-600 text-slate-300'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{player.name}</div>
                            <div className="text-sm text-slate-400">
                              {player.team} • {player.position}
                              {player.fantasyPositions &&
                                Array.isArray(player.fantasyPositions) &&
                                player.fantasyPositions.length > 1 && (
                                  <span className="ml-1 text-xs">
                                    ({player.fantasyPositions.join(', ')})
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">
                            ${(player.salary / 1000000).toFixed(1)}M
                          </div>
                          <div className="text-xs text-slate-500">
                            ${player.salary.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Mini gráfico de barra comparativa */}
                      <div className="mt-2">
                        <div className="w-full bg-slate-600 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              index === 0
                                ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                                : index === 1
                                  ? 'bg-gradient-to-r from-slate-400 to-slate-300'
                                  : index === 2
                                    ? 'bg-gradient-to-r from-amber-600 to-amber-500'
                                    : 'bg-gradient-to-r from-slate-500 to-slate-400'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Espaço decorativo se houver poucos jogadores */}
                {displayPlayers.length < maxPlayersPerPosition && (
                  <div className="flex-1 flex items-end justify-center pb-4">
                    <div className="text-center text-slate-500">
                      <div className="w-16 h-16 mx-auto mb-2 bg-slate-700/50 rounded-full flex items-center justify-center">
                        <UserGroupIcon className="h-8 w-8 text-slate-500" />
                      </div>
                      <p className="text-xs">Top {maxPlayersPerPosition} por posição</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="h-10 w-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 font-medium">Nenhum jogador encontrado</p>
                  <p className="text-sm text-slate-500 mt-1">para a posição {activeTab}</p>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé com estatísticas - fixo */}
          {activePositionData && activePositionData.players.length > 0 && (
            <div className="mt-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600 flex-shrink-0">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span>
                      Maior: ${(activePositionData.players[0]?.salary / 1000000 || 0).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    <span>
                      Média: $
                      {(
                        activePositionData.players.reduce((sum, p) => sum + p.salary, 0) /
                        activePositionData.players.length /
                        1000000
                      ).toFixed(1)}
                      M
                    </span>
                  </div>
                </div>
                <span className="text-blue-400 font-medium">{activeTab}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
              <UserGroupIcon className="h-10 w-10 text-slate-500" />
            </div>
            <p className="text-slate-400 font-medium">Nenhum dado disponível</p>
            <p className="text-sm text-slate-500 mt-1">
              Selecione uma liga para visualizar salários por posição
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

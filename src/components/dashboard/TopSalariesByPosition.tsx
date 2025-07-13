import React, { useState, useEffect } from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';

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
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState<string>('');

  // Definir a primeira posição como aba ativa quando os dados mudarem
  useEffect(() => {
    if (positionData.length > 0 && !activeTab) {
      setActiveTab(positionData[0].position);
    }
  }, [positionData, activeTab]);

  // Calcular jogadores da aba ativa
  const activePositionData = positionData.find(pos => pos.position === activeTab);
  const displayPlayers = activePositionData
    ? activePositionData.players.slice(0, maxPlayersPerPosition)
    : [];

  // Cores por posição (pode ser movido para utils/positionColors.ts futuramente)
  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      QB: 'text-purple-400 bg-purple-900/20 border-purple-700',
      RB: 'text-green-400 bg-green-900/20 border-green-700',
      WR: 'text-blue-400 bg-blue-900/20 border-blue-700',
      TE: 'text-orange-400 bg-orange-900/20 border-orange-700',
      K: 'text-yellow-400 bg-yellow-900/20 border-yellow-700',
      DEF: 'text-red-400 bg-red-900/20 border-red-700',
      DL: 'text-red-400 bg-red-900/20 border-red-700',
      LB: 'text-red-400 bg-red-900/20 border-red-700',
      DB: 'text-red-400 bg-red-900/20 border-red-700',
    };
    return colors[position] || 'text-slate-400 bg-slate-900/20 border-slate-700';
  };

  return (
    <div
      className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-4 sm:p-6 h-full"
      data-testid="top-salaries-by-position-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserGroupIcon className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <div className="text-xs text-slate-400">
          {positionData.length} {positionData.length === 1 ? 'posição' : 'posições'}
        </div>
      </div>

      {/* Sistema de Abas */}
      {positionData.length > 0 ? (
        <>
          {/* Navegação das Abas */}
          <div className="flex flex-wrap gap-1 mb-4 p-1 bg-slate-700 rounded-lg">
            {positionData.map(position => {
              const isActive = activeTab === position.position;
              const colorClasses = getPositionColor(position.position);

              return (
                <button
                  key={position.position}
                  onClick={() => setActiveTab(position.position)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? `${colorClasses} shadow-sm`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  {position.position}
                  <span className="ml-1 text-xs opacity-75">({position.players.length})</span>
                </button>
              );
            })}
          </div>

          {/* Conteúdo da Aba Ativa */}
          <div className="space-y-3">
            {displayPlayers.length > 0 ? (
              displayPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600 hover:bg-slate-650 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-7 h-7 bg-slate-600 rounded-full text-sm font-medium text-slate-200">
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
                    <div className="text-lg font-semibold text-green-400">
                      ${(player.salary / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-slate-500">${player.salary.toLocaleString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <div className="text-slate-400">Nenhum jogador encontrado</div>
                <div className="text-sm text-slate-500 mt-1">para a posição {activeTab}</div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <UserGroupIcon className="h-12 w-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum dado disponível</p>
          <p className="text-sm text-slate-500 mt-1">
            Selecione uma liga para visualizar salários por posição
          </p>
        </div>
      )}
    </div>
  );
}

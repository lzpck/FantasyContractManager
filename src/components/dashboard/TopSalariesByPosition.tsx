import React from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';

interface Player {
  id: string;
  name: string;
  position: string;
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
 * Componente para exibir os maiores salários por posição
 *
 * Regra de negócio:
 * - Exibe os top 3 jogadores com maiores salários por posição (QB, RB, WR, TE, etc.)
 * - Agrupa por posição e ordena por valor do salário dentro de cada posição
 * - Formatação em milhões de dólares
 * - Layout responsivo com grid de posições
 *
 * Integração futura:
 * - Receber dados via props do contexto da liga selecionada
 * - Filtrar apenas contratos ativos
 * - Considerar todas as posições relevantes (QB, RB, WR, TE, K, DEF)
 * - Aplicar cores específicas por posição usando positionColors.ts
 */
export function TopSalariesByPosition({
  positionData = [],
  title = 'Top 3 por Posição',
  maxPlayersPerPosition = 3,
}: TopSalariesByPositionProps) {
  // Cores por posição (pode ser movido para utils/positionColors.ts futuramente)
  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      QB: 'text-purple-400 bg-purple-900/20 border-purple-700',
      RB: 'text-green-400 bg-green-900/20 border-green-700',
      WR: 'text-blue-400 bg-blue-900/20 border-blue-700',
      TE: 'text-orange-400 bg-orange-900/20 border-orange-700',
      K: 'text-yellow-400 bg-yellow-900/20 border-yellow-700',
      DEF: 'text-red-400 bg-red-900/20 border-red-700',
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

      {/* Grid de posições */}
      <div className="space-y-4">
        {positionData.length > 0 ? (
          positionData.map(position => {
            const displayPlayers = position.players.slice(0, maxPlayersPerPosition);
            const colorClasses = getPositionColor(position.position);

            return (
              <div key={position.position} className="space-y-2">
                {/* Header da posição */}
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClasses}`}
                >
                  {position.position}
                </div>

                {/* Lista de jogadores da posição */}
                <div className="space-y-2 ml-2">
                  {displayPlayers.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 bg-slate-700 rounded-lg border border-slate-600 hover:bg-slate-650 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-slate-600 rounded-full text-xs font-medium text-slate-200">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-foreground text-sm">{player.name}</div>
                          <div className="text-xs text-slate-400">{player.team}</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-green-400">
                        ${(player.salary / 1000000).toFixed(1)}M
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
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
    </div>
  );
}

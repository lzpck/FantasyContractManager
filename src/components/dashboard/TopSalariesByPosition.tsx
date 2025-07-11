'use client';

import { UserGroupIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import React from 'react';
import { getPositionTailwindClasses } from '@/utils/positionColors';

interface PlayerSalary {
  id: string;
  playerName: string;
  teamName: string;
  salary: number;
  yearsRemaining: number;
}

interface PositionSalaries {
  position: string;
  players: PlayerSalary[];
}

interface TopSalariesByPositionProps {
  /** Dados dos maiores salários agrupados por posição */
  positionSalaries: PositionSalaries[];
  /** Se está carregando os dados */
  loading?: boolean;
}

/**
 * Componente que exibe os Top 3 maiores salários por posição
 *
 * Agrupa os contratos por posição (QB, RB, WR, TE, etc.) e mostra
 * os 3 maiores salários de cada posição na liga selecionada.
 */
export function TopSalariesByPosition({
  positionSalaries,
  loading = false,
}: TopSalariesByPositionProps) {
  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
        <div className="flex items-center mb-4">
          <UserGroupIcon className="h-6 w-6 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-slate-100">Maiores Salários por Posição</h3>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-6 bg-slate-600 rounded w-16 mb-3"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, playerIndex) => (
                  <div
                    key={playerIndex}
                    className="flex justify-between items-center p-2 bg-slate-700 rounded"
                  >
                    <div className="h-4 bg-slate-600 rounded w-32"></div>
                    <div className="h-4 bg-slate-600 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const [selectedPosition, setSelectedPosition] = useState<string>(
    positionSalaries.length > 0 ? positionSalaries[0].position : '',
  );

  // Atualizar posição selecionada quando os dados mudarem
  React.useEffect(() => {
    if (
      positionSalaries.length > 0 &&
      !positionSalaries.find(p => p.position === selectedPosition)
    ) {
      setSelectedPosition(positionSalaries[0].position);
    }
  }, [positionSalaries, selectedPosition]);

  const selectedPositionData = positionSalaries.find(p => p.position === selectedPosition);

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
      <div className="flex items-center mb-4">
        <UserGroupIcon className="h-6 w-6 text-blue-500 mr-2" />
        <h3 className="text-lg font-semibold text-slate-100">Maiores Salários por Posição</h3>
      </div>

      {positionSalaries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">Nenhum contrato encontrado</p>
        </div>
      ) : (
        <div>
          {/* Abas das posições */}
          <div className="flex flex-wrap gap-1 mb-4 border-b border-slate-600 pb-2">
            {positionSalaries.map(positionData => {
              const positionClasses = getPositionTailwindClasses(positionData.position);
              return (
                <button
                  key={positionData.position}
                  onClick={() => setSelectedPosition(positionData.position)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectedPosition === positionData.position
                      ? positionClasses
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {positionData.position}
                  <span className="ml-1 text-xs opacity-75">({positionData.players.length})</span>
                </button>
              );
            })}
          </div>

          {/* Conteúdo da posição selecionada */}
          <div>
            {selectedPositionData ? (
              <div className="space-y-3">
                {selectedPositionData.players.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex justify-between items-center p-3 bg-slate-700 rounded-lg hover:bg-slate-650 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400">#{index + 1}</span>
                        <span className="text-sm font-medium text-slate-100">
                          {player.playerName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {selectedPositionData.position}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {player.teamName} • {player.yearsRemaining}{' '}
                        {player.yearsRemaining === 1 ? 'ano' : 'anos'} restante
                        {player.yearsRemaining === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-green-400">
                      ${(player.salary / 1000000).toFixed(1)}M
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400">Nenhum jogador encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

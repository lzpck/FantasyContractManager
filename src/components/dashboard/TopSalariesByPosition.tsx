'use client';

import { UserGroupIcon } from '@heroicons/react/24/outline';

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
export function TopSalariesByPosition({ positionSalaries, loading = false }: TopSalariesByPositionProps) {
  // Cores para diferentes posições
  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      QB: 'bg-purple-600',
      RB: 'bg-green-600',
      WR: 'bg-blue-600',
      TE: 'bg-orange-600',
      K: 'bg-yellow-600',
      DEF: 'bg-red-600',
    };
    return colors[position] || 'bg-slate-600';
  };

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
                  <div key={playerIndex} className="flex justify-between items-center p-2 bg-slate-700 rounded">
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
        <div className="space-y-6">
          {positionSalaries.map((positionData) => (
            <div key={positionData.position}>
              <div className="flex items-center mb-3">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getPositionColor(positionData.position)}`}></span>
                <h4 className="font-semibold text-slate-200">{positionData.position}</h4>
              </div>
              
              <div className="space-y-2 ml-5">
                {positionData.players.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum jogador encontrado</p>
                ) : (
                  positionData.players.map((player, index) => (
                    <div 
                      key={player.id}
                      className="flex justify-between items-center p-2 bg-slate-700 rounded hover:bg-slate-650 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-400">#{index + 1}</span>
                          <span className="text-sm font-medium text-slate-100">{player.playerName}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {player.teamName} • {player.yearsRemaining} {player.yearsRemaining === 1 ? 'ano' : 'anos'}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-green-400">
                        ${(player.salary / 1000000).toFixed(1)}M
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
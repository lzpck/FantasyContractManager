'use client';

import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface PlayerSalary {
  id: string;
  playerName: string;
  position: string;
  teamName: string;
  salary: number;
  yearsRemaining: number;
}

interface TopSalariesProps {
  /** Lista dos 5 maiores salários da liga */
  topSalaries: PlayerSalary[];
  /** Se está carregando os dados */
  loading?: boolean;
}

/**
 * Componente que exibe os Top 5 maiores salários da liga selecionada
 *
 * Mostra os contratos com maiores valores, incluindo informações do jogador,
 * posição, time e anos restantes de contrato.
 */
export function TopSalaries({ topSalaries, loading = false }: TopSalariesProps) {
  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
        <div className="flex items-center mb-4">
          <CurrencyDollarIcon className="h-6 w-6 text-green-500 mr-2" />
          <h3 className="text-lg font-semibold text-slate-100">Top 5 Maiores Salários</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                <div className="flex-1">
                  <div className="h-4 bg-slate-600 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-slate-600 rounded w-24"></div>
                </div>
                <div className="h-4 bg-slate-600 rounded w-20"></div>
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
        <CurrencyDollarIcon className="h-6 w-6 text-green-500 mr-2" />
        <h3 className="text-lg font-semibold text-slate-100">Top 5 Maiores Salários</h3>
      </div>

      {topSalaries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">Nenhum contrato encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topSalaries.map((player, index) => (
            <div
              key={player.id}
              className="flex justify-between items-center p-3 bg-slate-700 rounded-lg hover:bg-slate-650 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-300">#{index + 1}</span>
                  <span className="font-semibold text-slate-100">{player.playerName}</span>
                  <span className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">
                    {player.position}
                  </span>
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  {player.teamName} • {player.yearsRemaining}{' '}
                  {player.yearsRemaining === 1 ? 'ano' : 'anos'} restante
                  {player.yearsRemaining !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-400">
                  ${(player.salary / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

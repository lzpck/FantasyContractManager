'use client';

import { TrophyIcon } from '@heroicons/react/24/outline';

interface TeamSpending {
  id: string;
  teamName: string;
  ownerName: string;
  totalSalary: number;
  activeContracts: number;
  salaryCap: number;
  usedPercentage: number;
}

interface TopSpendingTeamsProps {
  /** Lista dos times com maior gasto em salários */
  topSpendingTeams: TeamSpending[];
  /** Se está carregando os dados */
  loading?: boolean;
}

/**
 * Componente que exibe os times com mais salário total alocado
 *
 * Mostra os times que mais gastaram em salários na liga selecionada,
 * incluindo percentual do salary cap utilizado e número de contratos ativos.
 */
export function TopSpendingTeams({ topSpendingTeams, loading = false }: TopSpendingTeamsProps) {
  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
        <div className="flex items-center mb-4">
          <TrophyIcon className="h-6 w-6 text-yellow-500 mr-2" />
          <h3 className="text-lg font-semibold text-slate-100">Times com Mais Salário Alocado</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                <div className="flex-1">
                  <div className="h-4 bg-slate-600 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-slate-600 rounded w-24"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-slate-600 rounded w-20 mb-1"></div>
                  <div className="h-3 bg-slate-600 rounded w-16"></div>
                </div>
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
        <TrophyIcon className="h-6 w-6 text-yellow-500 mr-2" />
        <h3 className="text-lg font-semibold text-slate-100">Times com Mais Salário Alocado</h3>
      </div>

      {topSpendingTeams.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">Nenhum time encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topSpendingTeams.map((team, index) => {
            // Determinar cor baseada no percentual usado
            const getUsageColor = (percentage: number) => {
              if (percentage >= 95) return 'text-red-400';
              if (percentage >= 85) return 'text-orange-400';
              if (percentage >= 70) return 'text-yellow-400';
              return 'text-green-400';
            };

            const getUsageBgColor = (percentage: number) => {
              if (percentage >= 95) return 'bg-red-500';
              if (percentage >= 85) return 'bg-orange-500';
              if (percentage >= 70) return 'bg-yellow-500';
              return 'bg-green-500';
            };

            return (
              <div
                key={team.id}
                className="flex justify-between items-center p-3 bg-slate-700 rounded-lg hover:bg-slate-650 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-300">#{index + 1}</span>
                    <span className="font-semibold text-slate-100">{team.teamName}</span>
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    {team.ownerName} • {team.activeContracts} contratos ativos
                  </div>

                  {/* Barra de progresso do salary cap */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Salary Cap Usado</span>
                      <span className={getUsageColor(team.usedPercentage)}>
                        {team.usedPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getUsageBgColor(team.usedPercentage)}`}
                        style={{ width: `${Math.min(team.usedPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="font-bold text-green-400">
                    ${(team.totalSalary / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-slate-400">
                    de ${(team.salaryCap / 1000000).toFixed(0)}M
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

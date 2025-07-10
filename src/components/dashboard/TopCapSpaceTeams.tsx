'use client';

import { BanknotesIcon } from '@heroicons/react/24/outline';

interface TeamCapSpace {
  id: string;
  teamName: string;
  ownerName: string;
  availableCapSpace: number;
  salaryCap: number;
  usedPercentage: number;
  totalSalary: number;
}

interface TopCapSpaceTeamsProps {
  /** Lista dos times com mais cap space disponível */
  topCapSpaceTeams: TeamCapSpace[];
  /** Se está carregando os dados */
  loading?: boolean;
}

/**
 * Componente que exibe os times com mais cap space livre
 * 
 * Mostra os times com maior espaço disponível no salary cap,
 * útil para identificar quais times têm mais flexibilidade financeira.
 */
export function TopCapSpaceTeams({ topCapSpaceTeams, loading = false }: TopCapSpaceTeamsProps) {
  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
        <div className="flex items-center mb-4">
          <BanknotesIcon className="h-6 w-6 text-emerald-500 mr-2" />
          <h3 className="text-lg font-semibold text-slate-100">Times com Mais Cap Space</h3>
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
        <BanknotesIcon className="h-6 w-6 text-emerald-500 mr-2" />
        <h3 className="text-lg font-semibold text-slate-100">Times com Mais Cap Space</h3>
      </div>
      
      {topCapSpaceTeams.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">Nenhum time encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topCapSpaceTeams.map((team, index) => {
            const availablePercentage = 100 - team.usedPercentage;
            
            // Determinar cor baseada no cap space disponível
            const getCapSpaceColor = (percentage: number) => {
              if (percentage >= 50) return 'text-emerald-400';
              if (percentage >= 30) return 'text-green-400';
              if (percentage >= 15) return 'text-yellow-400';
              return 'text-orange-400';
            };

            const getCapSpaceBgColor = (percentage: number) => {
              if (percentage >= 50) return 'bg-emerald-500';
              if (percentage >= 30) return 'bg-green-500';
              if (percentage >= 15) return 'bg-yellow-500';
              return 'bg-orange-500';
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
                    {team.ownerName}
                  </div>
                  
                  {/* Barra de progresso do cap space disponível */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Cap Space Disponível</span>
                      <span className={getCapSpaceColor(availablePercentage)}>
                        {availablePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getCapSpaceBgColor(availablePercentage)}`}
                        style={{ width: `${Math.min(availablePercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Informação adicional sobre salário usado */}
                  <div className="text-xs text-slate-500 mt-1">
                    Usado: ${(team.totalSalary / 1000000).toFixed(1)}M de ${(team.salaryCap / 1000000).toFixed(0)}M
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <div className="font-bold text-emerald-400">
                    ${(team.availableCapSpace / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-slate-400">
                    disponível
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
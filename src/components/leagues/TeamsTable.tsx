'use client';

import { TeamFinancialSummary } from '@/types';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { formatCurrency, getCurrencyClasses } from '@/utils/formatUtils';

interface TeamsTableProps {
  /** Lista de resumos financeiros dos times */
  teams: TeamFinancialSummary[];
  /** Função chamada ao clicar em um time */
  onTeamClick: (teamId: string) => void;
}

/**
 * Componente de tabela de times com informações financeiras
 *
 * Exibe lista de times com salary cap, valores usados/disponíveis,
 * contratos expirando e ações para acessar detalhes do time.
 */
export default function TeamsTable({ teams, onTeamClick }: TeamsTableProps) {
  // Função para calcular percentual do cap usado
  const getCapUsagePercentage = (totalSalaries: number, salaryCap: number = 279000000) => {
    return ((totalSalaries / salaryCap) * 100).toFixed(1);
  };

  // Função para obter cor baseada no percentual do cap usado
  const getCapUsageColor = (percentage: number) => {
    if (percentage >= 95) return 'text-red-600';
    if (percentage >= 85) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">👥</div>
        <h3 className="text-lg font-medium text-slate-100 mb-2">Nenhum time encontrado</h3>
        <p className="text-slate-400">Não há times que correspondam aos filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-600">
        <thead className="bg-slate-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Manager
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Salary Cap Usado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Cap Disponível
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Dead Money
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Contratos Expirando
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-slate-800 divide-y divide-slate-600">
          {teams.map(teamSummary => {
            const capUsagePercentage = parseFloat(getCapUsagePercentage(teamSummary.totalSalaries));

            return (
              <tr
                key={teamSummary.team.id}
                className="hover:bg-slate-700 transition-colors cursor-pointer"
                onClick={() => onTeamClick(teamSummary.team.id)}
              >
                {/* Time */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-900/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-200">
                          {teamSummary.team.abbreviation}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-100">
                        {teamSummary.team.name}
                      </div>
                      <div className="text-sm text-slate-400">{teamSummary.team.abbreviation}</div>
                    </div>
                  </div>
                </td>

                {/* Manager */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-100">
                    {teamSummary.team.ownerDisplayName || '—'}
                  </div>
                </td>

                {/* Salary Cap Usado */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-100">
                    {formatCurrency(teamSummary.totalSalaries)}
                  </div>
                  <div className={`text-sm ${getCapUsageColor(capUsagePercentage)}`}>
                    {capUsagePercentage}% do cap
                  </div>
                </td>

                {/* Cap Disponível */}
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  <div className="flex flex-col">
                    <span className="text-slate-100 font-medium">
                      {formatCurrency(teamSummary.availableCap)}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {((teamSummary.availableCap / 279000000) * 100).toFixed(1)}% livre
                    </span>
                  </div>
                </td>

                {/* Dead Money */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-100">
                    {formatCurrency(teamSummary.currentDeadMoney)}
                  </div>
                  {teamSummary.nextSeasonDeadMoney > 0 && (
                    <div className="text-sm text-slate-400">
                      +{formatCurrency(teamSummary.nextSeasonDeadMoney)} próx.
                    </div>
                  )}
                </td>

                {/* Contratos Expirando */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-slate-100">
                      {teamSummary.contractsExpiring}
                    </span>
                    {teamSummary.contractsExpiring > 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-200">
                        ⚠️ Atenção
                      </span>
                    )}
                  </div>
                </td>

                {/* Ações */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onTeamClick(teamSummary.team.id);
                    }}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-xl text-blue-200 bg-blue-900/30 hover:bg-blue-800/50 transition-colors shadow-md"
                  >
                    Ver Time
                    <ChevronRightIcon className="ml-1 h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Resumo da tabela */}
      <div className="bg-slate-700 px-6 py-3 border-t border-slate-600">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Total de {teams.length} times</span>
          <div className="flex space-x-6">
            <span>
              Cap médio usado:{' '}
              {formatCurrency(
                teams.reduce((acc, team) => acc + team.totalSalaries, 0) / teams.length,
              )}
            </span>
            <span>
              Cap médio disponível:{' '}
              {formatCurrency(
                teams.reduce((acc, team) => acc + team.availableCap, 0) / teams.length,
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

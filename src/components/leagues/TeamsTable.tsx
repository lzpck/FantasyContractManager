'use client';

import { TeamFinancialSummary } from '@/types';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

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
export function TeamsTable({ teams, onTeamClick }: TeamsTableProps) {
  // Função para formatar valores monetários
  const formatMoney = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum time encontrado</h3>
        <p className="text-gray-600">Não há times que correspondam aos filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Manager
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Salary Cap Usado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cap Disponível
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dead Money
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contratos Expirando
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {teams.map(teamSummary => {
            const capUsagePercentage = parseFloat(getCapUsagePercentage(teamSummary.totalSalaries));

            return (
              <tr
                key={teamSummary.team.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onTeamClick(teamSummary.team.id)}
              >
                {/* Time */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-800">
                          {teamSummary.team.abbreviation}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {teamSummary.team.name}
                      </div>
                      <div className="text-sm text-gray-500">{teamSummary.team.abbreviation}</div>
                    </div>
                  </div>
                </td>

                {/* Manager */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    Manager {teamSummary.team.ownerId.slice(-2)}
                  </div>
                  <div className="text-sm text-gray-500">owner@example.com</div>
                </td>

                {/* Salary Cap Usado */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatMoney(teamSummary.totalSalaries)}
                  </div>
                  <div className={`text-sm ${getCapUsageColor(capUsagePercentage)}`}>
                    {capUsagePercentage}% do cap
                  </div>
                </td>

                {/* Cap Disponível */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatMoney(teamSummary.availableCap)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {((teamSummary.availableCap / 279000000) * 100).toFixed(1)}% livre
                  </div>
                </td>

                {/* Dead Money */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatMoney(teamSummary.currentDeadMoney)}
                  </div>
                  {teamSummary.nextSeasonDeadMoney > 0 && (
                    <div className="text-sm text-gray-500">
                      +{formatMoney(teamSummary.nextSeasonDeadMoney)} próx.
                    </div>
                  )}
                </td>

                {/* Contratos Expirando */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {teamSummary.contractsExpiring}
                    </span>
                    {teamSummary.contractsExpiring > 0 && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
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
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
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
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Total de {teams.length} times</span>
          <div className="flex space-x-6">
            <span>
              Cap médio usado:{' '}
              {formatMoney(teams.reduce((acc, team) => acc + team.totalSalaries, 0) / teams.length)}
            </span>
            <span>
              Cap médio disponível:{' '}
              {formatMoney(teams.reduce((acc, team) => acc + team.availableCap, 0) / teams.length)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Team, PlayerWithContract, League } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatCurrency, CURRENCY_CONSTANTS } from '@/utils/formatUtils';

interface CapProjectionChartProps {
  /** Time para projeção */
  team: Team;
  /** Lista de jogadores com contratos */
  players: PlayerWithContract[];
  /** Liga para obter o salary cap */
  league: League;
}

/**
 * Componente de gráfico de projeção de salary cap
 *
 * Exibe um gráfico de barras mostrando as projeções
 * de salary cap para as próximas temporadas.
 */
export function CapProjectionChart({ team, players, league }: CapProjectionChartProps) {
  const currentYear = new Date().getFullYear();
  const salaryCap = league.salaryCap;

  // Calcular projeções para os próximos 4 anos
  const projectionData = [];

  for (let year = 0; year < 4; year++) {
    const seasonYear = currentYear + year;
    let totalSalaries = 0;
    let deadMoney = 0;
    let contractsCount = 0;

    // Calcular salários para cada jogador nesta temporada
    players.forEach(playerWithContract => {
      const contract = playerWithContract.contract;

      // Verificar se o contrato existe e ainda está ativo nesta temporada
      // Para o ano atual (year = 0), usar yearsRemaining >= 1
      // Para anos futuros, ajustar baseado nos anos que passaram
      const remainingYearsForThisSeason = contract?.yearsRemaining ? contract.yearsRemaining - year : 0;
      
      if (contract && remainingYearsForThisSeason > 0) {
        // Aplicar aumento de 15% por ano
        const projectedSalary = contract.currentSalary * Math.pow(1.15, year);
        totalSalaries += projectedSalary;
        contractsCount++;
      }
    });

    // Dead money (apenas no primeiro ano após corte)
    if (year === 0) {
      deadMoney = team.currentDeadMoney;
    } else if (year === 1) {
      deadMoney = team.nextSeasonDeadMoney;
    }

    const totalCommitted = totalSalaries + deadMoney;
    const availableCap = salaryCap - totalCommitted;
    const capUsagePercentage = salaryCap > 0 ? (totalCommitted / salaryCap) * 100 : 0;

    projectionData.push({
      year: seasonYear,
      yearLabel: year === 0 ? 'Atual' : `+${year}`,
      totalSalaries,
      deadMoney,
      totalCommitted,
      availableCap,
      capUsagePercentage: capUsagePercentage.toFixed(1),
      contractsCount,
    });
  }

  // Componente customizado para tooltip
  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: {
        totalSalaries: number;
        deadMoney: number;
        totalCap: number;
        availableCap: number;
      };
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 p-4 border border-slate-700 rounded-xl shadow-xl">
          <p className="font-medium text-slate-100 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-400">Salários: {formatCurrency(data.totalSalaries)}</p>
            {data.deadMoney > 0 && (
              <p className="text-red-400">Dead Money: {formatCurrency(data.deadMoney)}</p>
            )}
            <p className="text-slate-100 font-medium">
              Total Comprometido: {formatCurrency(data.totalSalaries + data.deadMoney)}
            </p>
            <p
              className={`font-medium ${
                data.availableCap >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              Cap Disponível: {formatCurrency(data.availableCap)}
            </p>
            <p className="text-slate-400">
              Uso do Cap:{' '}
              {(((data.totalSalaries + data.deadMoney) / data.totalCap) * 100).toFixed(1)}%
            </p>
            <p className="text-slate-400">
              Contratos Ativos:{' '}
              {players.filter(p => p.contract && p.contract.yearsRemaining > 0).length}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Verificar se há jogadores com contratos válidos
  const playersWithValidContracts = players.filter(p => p.contract && p.contract.currentSalary > 0);

  // Se não há contratos válidos, mostrar mensagem informativa
  if (playersWithValidContracts.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
        <h3 className="text-lg font-medium text-slate-100 mb-4">Projeção de Salary Cap</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-slate-400">
            <p className="text-lg font-medium mb-2">Nenhum contrato ativo</p>
            <p className="text-sm">
              Adicione contratos aos jogadores para ver as projeções de salary cap.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
      <h3 className="text-lg font-medium text-slate-100 mb-4">Projeção de Salary Cap</h3>

      {/* Gráfico */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="yearLabel" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              tickFormatter={value => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Linha de referência do salary cap */}
            <ReferenceLine
              y={salaryCap}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: 'Salary Cap', position: 'top' }}
            />

            {/* Barras */}
            <Bar dataKey="totalSalaries" stackId="committed" fill="#3b82f6" name="Salários" />
            <Bar dataKey="deadMoney" stackId="committed" fill="#ef4444" name="Dead Money" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center space-x-6 mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-sm text-slate-300">Salários</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-sm text-slate-300">Dead Money</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 border-2 border-red-500 border-dashed rounded"></div>
          <span className="text-sm text-slate-300">Salary Cap</span>
        </div>
      </div>

      {/* Tabela de Resumo */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-700/50">
            <tr className="border-b border-slate-600">
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-2">
                Temporada
              </th>
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-2">
                Contratos
              </th>
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-2">
                Salários
              </th>
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-2">
                Dead Money
              </th>
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-2">
                Total
              </th>
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-2">
                Disponível
              </th>
              <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-2">
                Uso %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-600">
            {projectionData.map((data, index) => (
              <tr key={data.year} className={`hover:bg-slate-700/30 transition-colors ${index === 0 ? 'bg-blue-900/20' : ''}`}>
                <td className="py-3 px-2 text-sm font-medium text-slate-100">
                  {data.year} {index === 0 && '(Atual)'}
                </td>
                <td className="py-3 px-2 text-sm text-slate-300">{data.contractsCount}</td>
                <td className="py-3 px-2 text-sm text-slate-300">{formatCurrency(data.totalSalaries)}</td>
                <td className="py-3 px-2 text-sm text-slate-300">
                  {data.deadMoney > 0 ? formatCurrency(data.deadMoney) : '-'}
                </td>
                <td className="py-3 px-2 text-sm font-medium text-slate-100">
                  {formatCurrency(data.totalCommitted)}
                </td>
                <td
                  className={`py-3 px-2 text-sm font-medium ${
                    data.availableCap >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {formatCurrency(data.availableCap)}
                </td>
                <td
                  className={`py-3 px-2 text-sm font-medium ${
                    parseFloat(data.capUsagePercentage) >= 95
                      ? 'text-red-400'
                      : parseFloat(data.capUsagePercentage) >= 85
                        ? 'text-yellow-400'
                        : 'text-green-400'
                  }`}
                >
                  {data.capUsagePercentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alertas */}
      {projectionData.some(d => d.availableCap < 0) && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-200">Alerta de Salary Cap</h3>
              <p className="text-sm text-red-300 mt-1">
                O time está projetado para exceder o salary cap em uma ou mais temporadas futuras.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

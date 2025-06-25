'use client';

import { Team, PlayerWithContract } from '@/types';
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

interface CapProjectionChartProps {
  /** Time para projeção */
  team: Team;
  /** Lista de jogadores com contratos */
  players: PlayerWithContract[];
}

/**
 * Componente de gráfico de projeção de salary cap
 *
 * Exibe um gráfico de barras mostrando as projeções
 * de salary cap para as próximas temporadas.
 */
export function CapProjectionChart({ team, players }: CapProjectionChartProps) {
  const currentYear = new Date().getFullYear();
  const salaryCap = 279000000; // $279M padrão

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

      // Verificar se o contrato ainda está ativo nesta temporada
      if (contract.yearsRemaining > year) {
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
    const capUsagePercentage = (totalCommitted / salaryCap) * 100;

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
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">Salários: {formatMoney(data.totalSalaries)}</p>
            {data.deadMoney > 0 && (
              <p className="text-red-600">Dead Money: {formatMoney(data.deadMoney)}</p>
            )}
            <p className="text-gray-900 font-medium">
              Total Comprometido: {formatMoney(data.totalCommitted)}
            </p>
            <p
              className={`font-medium ${
                data.availableCap >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              Cap Disponível: {formatMoney(data.availableCap)}
            </p>
            <p className="text-gray-600">Uso do Cap: {data.capUsagePercentage}%</p>
            <p className="text-gray-600">Contratos Ativos: {data.contractsCount}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Encontrar o valor máximo para ajustar a escala
  const maxValue = Math.max(
    salaryCap,
    ...projectionData.map(d => Math.max(d.totalCommitted, salaryCap)),
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Projeção de Salary Cap</h3>

      {/* Gráfico */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="yearLabel" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              tickFormatter={value => formatMoney(value)}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Linha de referência do salary cap */}
            <ReferenceLine
              y={salaryCap}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: 'Salary Cap', position: 'topRight' }}
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
          <span className="text-sm text-gray-600">Salários</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-600">Dead Money</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 border-2 border-red-500 border-dashed rounded"></div>
          <span className="text-sm text-gray-600">Salary Cap</span>
        </div>
      </div>

      {/* Tabela de Resumo */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                Temporada
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                Contratos
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                Salários
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                Dead Money
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                Total
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                Disponível
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                Uso %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projectionData.map((data, index) => (
              <tr key={data.year} className={index === 0 ? 'bg-blue-50' : ''}>
                <td className="py-2 text-sm font-medium text-gray-900">
                  {data.year} {index === 0 && '(Atual)'}
                </td>
                <td className="py-2 text-sm text-gray-900">{data.contractsCount}</td>
                <td className="py-2 text-sm text-gray-900">{formatMoney(data.totalSalaries)}</td>
                <td className="py-2 text-sm text-gray-900">
                  {data.deadMoney > 0 ? formatMoney(data.deadMoney) : '-'}
                </td>
                <td className="py-2 text-sm font-medium text-gray-900">
                  {formatMoney(data.totalCommitted)}
                </td>
                <td
                  className={`py-2 text-sm font-medium ${
                    data.availableCap >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatMoney(data.availableCap)}
                </td>
                <td
                  className={`py-2 text-sm font-medium ${
                    parseFloat(data.capUsagePercentage) >= 95
                      ? 'text-red-600'
                      : parseFloat(data.capUsagePercentage) >= 85
                        ? 'text-yellow-600'
                        : 'text-green-600'
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
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
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
              <h3 className="text-sm font-medium text-red-800">Alerta de Salary Cap</h3>
              <p className="text-sm text-red-700 mt-1">
                O time está projetado para exceder o salary cap em uma ou mais temporadas futuras.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

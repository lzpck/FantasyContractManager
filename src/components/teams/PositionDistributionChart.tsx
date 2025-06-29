'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PlayerWithContract } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';
import { getPositionHexColor, getPositionSortIndex } from '@/utils/positionColors';

interface PositionDistributionChartProps {
  players: PlayerWithContract[];
}

export default function PositionDistributionChart({ players }: PositionDistributionChartProps) {
  // Filtrar jogadores com contratos



  // Filtrar jogadores que têm contratos válidos
  const playersWithValidContracts = players.filter(p => p.contract && p.contract.currentSalary);

  // Agrupar dados por posição (usando fantasyPositions)
  const positionData = playersWithValidContracts.reduce(
    (acc, playerWithContract) => {
      // Usar a primeira posição de fantasyPositions, pular se não existir
      const position = playerWithContract.player.fantasyPositions?.[0];
      const salary = playerWithContract.contract.currentSalary;

      // Pular jogadores sem posição de fantasy definida
      if (!position) {
        return acc;
      }

      if (!acc[position]) {
        acc[position] = {
          position,
          count: 0,
          totalSalary: 0,
          players: [],
        };
      }

      acc[position].count += 1;
      acc[position].totalSalary += salary;
      acc[position].players.push(playerWithContract);

      return acc;
    },
    {} as Record<
      string,
      {
        position: string;
        count: number;
        totalSalary: number;
        players: PlayerWithContract[];
      }
    >,
  );

  // Converter para array e ordenar por posição oficial
  const totalSalarySum = playersWithValidContracts.reduce(
    (sum, p) => sum + p.contract.currentSalary,
    0,
  );
  const chartData = Object.values(positionData)
    .map(data => ({
      ...data,
      percentage:
        totalSalarySum > 0 ? ((data.totalSalary / totalSalarySum) * 100).toFixed(1) : '0.0',
    }))
    .sort((a, b) => {
      // Primeiro ordenar por posição oficial
      const orderA = getPositionSortIndex(a.position);
      const orderB = getPositionSortIndex(b.position);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // Se as posições forem iguais, ordenar por total de salário (decrescente)
      return b.totalSalary - a.totalSalary;
    });

  // Tipos para componentes customizados
  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: {
        position: string;
        count: number;
        totalSalary: number;
        percentage: string;
      };
    }>;
  }

  interface LegendProps {
    payload?: Array<{
      value: string;
      color: string;
    }>;
  }

  // Componente customizado para tooltip
  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 p-3 border border-slate-700 rounded-xl shadow-xl">
          <p className="font-medium text-slate-100">{data.position}</p>
          <p className="text-sm text-slate-400">{data.count} jogador(es)</p>
          <p className="text-sm text-slate-400">{formatCurrency(data.totalSalary)} total</p>
          <p className="text-sm text-slate-400">{data.percentage}% do cap</p>
        </div>
      );
    }
    return null;
  };

  // Componente customizado para legenda
  const CustomLegend = ({ payload }: LegendProps) => (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {chartData.map((data, index: number) => (
        <div key={index} className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getPositionHexColor(data.position) }}></div>
          <span className="text-sm text-slate-400">
            {data.position} ({data.count})
          </span>
        </div>
      ))}
    </div>
  );

  if (players.length === 0 || playersWithValidContracts.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
        <h3 className="text-lg font-medium text-slate-100 mb-4">Distribuição por Posição</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-slate-400">
            <p className="text-lg font-medium mb-2">Nenhum dado disponível</p>
            <p className="text-sm">
              {players.length === 0
                ? 'Carregue os jogadores para ver a distribuição por posição.'
                : 'Nenhum jogador possui contrato válido.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
      <h3 className="text-lg font-medium text-slate-100 mb-4">Distribuição por Posição</h3>

      {/* Gráfico */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="totalSalary"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getPositionHexColor(entry.position)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de Resumo */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-slate-100 mb-3">Resumo por Posição</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-700/50">
              <tr className="border-b border-slate-600">
                <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-2">
                  Posição
                </th>
                <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-2">
                  Jogadores
                </th>
                <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-2">
                  Total
                </th>
                <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-2">
                  Média
                </th>
                <th className="text-left text-xs font-medium text-slate-300 uppercase tracking-wider py-3 px-2">
                  % do Cap
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-600">
              {chartData.map(data => (
                <tr key={data.position} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getPositionHexColor(data.position) }}
                      ></div>
                      <span className="text-sm font-medium text-slate-100">{data.position}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm text-slate-300">{data.count}</td>
                  <td className="py-3 px-2 text-sm font-medium text-slate-100">
                    {formatCurrency(data.totalSalary)}
                  </td>
                  <td className="py-3 px-2 text-sm text-slate-300">
                    {formatCurrency(data.totalSalary / data.count)}
                  </td>
                  <td className="py-3 px-2 text-sm text-slate-300">{data.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

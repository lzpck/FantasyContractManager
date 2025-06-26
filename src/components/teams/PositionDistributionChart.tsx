'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PlayerWithContract } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';

interface PositionDistributionChartProps {
  players: PlayerWithContract[];
}

export default function PositionDistributionChart({ players }: PositionDistributionChartProps) {
  // Filtrar jogadores com contratos
  const playersWithContracts = players.filter(player => player.contract);

  // Cores para cada posição
  const POSITION_COLORS: Record<string, string> = {
    QB: '#3B82F6', // Blue
    RB: '#10B981', // Green
    WR: '#F59E0B', // Yellow
    TE: '#8B5CF6', // Purple
    K: '#EF4444', // Red
    DEF: '#6B7280', // Gray
  };

  // Agrupar dados por posição
  const positionData = players.reduce(
    (acc, playerWithContract) => {
      const position = playerWithContract.player.position;
      const salary = playerWithContract.contract.currentSalary;

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

  // Converter para array e ordenar por total de salário
  const chartData = Object.values(positionData)
    .map(data => ({
      ...data,
      percentage: (
        (data.totalSalary / players.reduce((sum, p) => sum + p.contract.currentSalary, 0)) *
        100
      ).toFixed(1),
    }))
    .sort((a, b) => b.totalSalary - a.totalSalary);

  // Componente customizado para tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.position}</p>
          <p className="text-sm text-gray-600">{data.count} jogador(es)</p>
          <p className="text-sm text-gray-600">{formatCurrency(data.totalSalary)} total</p>
          <p className="text-sm text-gray-600">{data.percentage}% do cap</p>
        </div>
      );
    }
    return null;
  };

  // Componente customizado para legenda
  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
          <span className="text-sm text-gray-600">
            {entry.value} ({chartData.find(d => d.position === entry.value)?.count})
          </span>
        </div>
      ))}
    </div>
  );

  if (players.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição por Posição</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">Nenhum dado disponível</p>
            <p className="text-sm">Adicione jogadores para ver a distribuição por posição.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição por Posição</h3>

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
                <Cell key={`cell-${index}`} fill={POSITION_COLORS[entry.position] || '#9CA3AF'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de Resumo */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Resumo por Posição</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                  Posição
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                  Jogadores
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                  Total
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                  Média
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                  % do Cap
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chartData.map(data => (
                <tr key={data.position}>
                  <td className="py-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: POSITION_COLORS[data.position] || '#9CA3AF' }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900">{data.position}</span>
                    </div>
                  </td>
                  <td className="py-2 text-sm text-gray-900">{data.count}</td>
                  <td className="py-2 text-sm font-medium text-gray-900">
                    {formatCurrency(data.totalSalary)}
                  </td>
                  <td className="py-2 text-sm text-gray-900">
                    {formatCurrency(data.totalSalary / data.count)}
                  </td>
                  <td className="py-2 text-sm text-gray-900">{data.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

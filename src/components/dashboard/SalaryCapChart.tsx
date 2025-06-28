'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { League } from '@/types';
import { useLeagueSalaryCap } from '@/hooks/useSalaryCap';

interface SalaryCapChartProps {
  /** Lista de ligas para exibir no gráfico */
  leagues: League[];
}

/**
 * Componente de gráfico de barras para distribuição do salary cap
 *
 * Exibe a distribuição do salary cap por time com dados reais.
 * Inclui dropdown para seleção de liga e utiliza a biblioteca Recharts.
 */
export function SalaryCapChart({ leagues }: SalaryCapChartProps) {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(
    leagues.length > 0 ? leagues[0].id : '',
  );

  const { teams, loading, error } = useLeagueSalaryCap(selectedLeagueId);

  // Preparar dados para o gráfico
  const chartData = teams.map(team => ({
    team: team.teamName,
    usado: Math.round(team.usedCap / 1000000), // Converter para milhões
    disponivel: Math.round(team.availableCap / 1000000), // Converter para milhões
    total: Math.round(team.totalCap / 1000000), // Converter para milhões
    percentage: team.usedPercentage,
  }));

  // Tooltip customizado para exibir valores formatados
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 p-3 border border-slate-700 rounded-xl shadow-xl">
          <p className="font-semibold text-slate-100">{label}</p>
          <p className="text-slate-300">
            <span className="inline-block w-3 h-3 bg-slate-500 rounded mr-2"></span>
            Cap Usado: ${payload[0].value}M
          </p>
          <p className="text-green-600">
            <span className="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span>
            Cap Disponível: ${payload[1].value}M
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Total: ${payload[0].value + payload[1].value}M
          </p>
        </div>
      );
    }
    return null;
  };

  // Estados de carregamento e erro
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-slate-400 text-sm">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">Erro ao carregar dados: {error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Dropdown de seleção de liga */}
      {leagues.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Selecionar Liga</label>
          <select
            value={selectedLeagueId}
            onChange={e => setSelectedLeagueId(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          >
            {leagues.map(league => (
              <option key={league.id} value={league.id}>
                {league.name} ({league.season})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Gráfico */}
      <div className="w-full h-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 20,
              left: 10,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="team"
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={value => `$${value}M`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="usado"
              stackId="a"
              fill="#EF4444"
              name="Cap Usado"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="disponivel"
              stackId="a"
              fill="#10B981"
              name="Cap Disponível"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { League } from '@/types';

interface SalaryCapChartProps {
  /** Lista de ligas para exibir no gráfico */
  leagues: League[];
}

/**
 * Componente de gráfico de barras para distribuição do salary cap
 *
 * Exibe a distribuição do salary cap por time usando dados mock.
 * Utiliza a biblioteca Recharts para renderização do gráfico.
 */
export function SalaryCapChart({ leagues }: SalaryCapChartProps) {
  // Gerar dados mock para o gráfico baseado nas ligas
  const generateChartData = () => {
    if (leagues.length === 0) {
      return [];
    }

    // Usar a primeira liga como exemplo
    const league = leagues[0];
    const data = [];

    // Gerar dados mock para 12 times
    for (let i = 1; i <= league.totalTeams; i++) {
      const usedCap = Math.random() * 200000000 + 50000000; // Entre $50M e $250M
      const availableCap = league.salaryCap - usedCap;

      data.push({
        team: `Time ${i}`,
        usado: Math.round(usedCap / 1000000), // Converter para milhões
        disponivel: Math.round(availableCap / 1000000), // Converter para milhões
        total: Math.round(league.salaryCap / 1000000), // Converter para milhões
      });
    }

    return data;
  };

  const chartData = generateChartData();

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
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-blue-600">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded mr-2"></span>
            Cap Usado: ${payload[0].value}M
          </p>
          <p className="text-green-600">
            <span className="inline-block w-3 h-3 bg-green-500 rounded mr-2"></span>
            Cap Disponível: ${payload[1].value}M
          </p>
          <p className="text-gray-600 text-sm mt-1">
            Total: ${payload[0].value + payload[1].value}M
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>Nenhuma liga disponível</p>
          <p className="text-sm">Adicione uma liga para ver o gráfico</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="team" tick={{ fontSize: 12 }} stroke="#6b7280" />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            label={{ value: 'Milhões ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="usado" stackId="a" fill="#3b82f6" name="Cap Usado" radius={[0, 0, 0, 0]} />
          <Bar
            dataKey="disponivel"
            stackId="a"
            fill="#10b981"
            name="Cap Disponível"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Legenda personalizada */}
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Cap Usado</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Cap Disponível</span>
        </div>
      </div>
    </div>
  );
}

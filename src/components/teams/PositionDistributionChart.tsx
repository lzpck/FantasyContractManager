'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PlayerWithContract } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';

interface PositionDistributionChartProps {
  players: PlayerWithContract[];
}

export default function PositionDistributionChart({ players }: PositionDistributionChartProps) {
  // Filtrar jogadores com contratos

  // Cores distintas para cada posição - otimizadas para acessibilidade e modo escuro
  const POSITION_COLORS: Record<string, string> = {
    QB: '#4F8EF7', // Azul vibrante
    RB: '#19C37D', // Verde esmeralda
    WR: '#FF9800', // Laranja
    TE: '#9C27B0', // Roxo
    K: '#E53935', // Vermelho
    DL: '#00BCD4', // Ciano
    LB: '#FF5722', // Vermelho-laranja
    DB: '#795548', // Marrom
    DEF: '#607D8B', // Azul-acinzentado
    // Posições adicionais com cores de fallback
    DT: '#3F51B5', // Índigo
    DE: '#009688', // Verde-azulado
    OLB: '#FF6F00', // Âmbar escuro
    ILB: '#8BC34A', // Verde-lima
    CB: '#E91E63', // Rosa
    S: '#673AB7', // Roxo escuro
    FS: '#2196F3', // Azul
    SS: '#FFC107', // Amarelo
  };

  // Função para obter cor da posição com fallback
  const getPositionColor = (position: string): string => {
    return POSITION_COLORS[position] || '#9CA3AF'; // Cinza como fallback
  };

  // Filtrar jogadores que têm contratos válidos
  const playersWithValidContracts = players.filter(p => p.contract && p.contract.currentSalary);

  // Agrupar dados por posição
  const positionData = playersWithValidContracts.reduce(
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
    .sort((a, b) => b.totalSalary - a.totalSalary);

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
        <div className="bg-slate-900 p-4 border-2 border-slate-600 rounded-xl shadow-2xl backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-2">
            <div
              className="w-3 h-3 rounded-full border border-slate-400"
              style={{ backgroundColor: getPositionColor(data.position) }}
            ></div>
            <p className="font-bold text-slate-100 text-base">{data.position}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-300">
              <span className="font-medium">Jogadores:</span> {data.count}
            </p>
            <p className="text-sm text-slate-300">
              <span className="font-medium">Total:</span> {formatCurrency(data.totalSalary)}
            </p>
            <p className="text-sm text-slate-300">
              <span className="font-medium">Média:</span>{' '}
              {formatCurrency(data.totalSalary / data.count)}
            </p>
            <p className="text-sm text-slate-300">
              <span className="font-medium">% do Cap:</span> {data.percentage}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Componente customizado para legenda
  const CustomLegend = ({ payload }: LegendProps) => (
    <div className="flex flex-wrap justify-center gap-3 mt-6 px-2">
      {payload?.map((entry, index: number) => {
        const positionData = chartData.find(d => d.position === entry.value);
        return (
          <div
            key={index}
            className="flex items-center space-x-2 bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600/50"
          >
            <div
              className="w-4 h-4 rounded-full border border-slate-500/30"
              style={{ backgroundColor: entry.color }}
              aria-label={`Cor da posição ${entry.value}`}
            ></div>
            <span className="text-sm font-medium text-slate-200">{entry.value}</span>
            <span className="text-xs text-slate-400 bg-slate-600/50 px-2 py-1 rounded">
              {positionData?.count || 0}
            </span>
          </div>
        );
      })}
    </div>
  );

  if (players.length === 0 || playersWithValidContracts.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
        <h3 className="text-lg font-medium text-slate-100 mb-4">Distribuição por Posição</h3>
        <div className="flex items-center justify-center h-72">
          <div className="text-center text-slate-400 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2 text-slate-300">Nenhum dado disponível</p>
            <p className="text-sm leading-relaxed">
              {players.length === 0
                ? 'Carregue os jogadores para ver a distribuição por posição e análise detalhada dos contratos.'
                : 'Nenhum jogador possui contrato válido. Adicione contratos para visualizar a distribuição.'}
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
      <div className="h-72 sm:h-80 lg:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={100}
              paddingAngle={3}
              dataKey="totalSalary"
              nameKey="position"
              aria-label="Gráfico de distribuição de jogadores por posição"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getPositionColor(entry.position)}
                  stroke="#1e293b"
                  strokeWidth={2}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'transparent' }}
              wrapperStyle={{ outline: 'none' }}
            />
            <Legend content={<CustomLegend />} wrapperStyle={{ outline: 'none' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de Resumo */}
      <div className="mt-8">
        <h4 className="text-lg font-medium text-slate-100 mb-4">Resumo por Posição</h4>
        <div className="overflow-x-auto rounded-lg border border-slate-600">
          <table className="min-w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-3">
                  Posição
                </th>
                <th className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-3">
                  Jogadores
                </th>
                <th className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-3">
                  Total
                </th>
                <th className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-3">
                  Média
                </th>
                <th className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-3">
                  % do Cap
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-600">
              {chartData.map((data, index) => (
                <tr
                  key={data.position}
                  className={`hover:bg-slate-700/50 transition-colors ${
                    index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/70'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full border border-slate-500/30 flex-shrink-0"
                        style={{ backgroundColor: getPositionColor(data.position) }}
                        aria-label={`Cor da posição ${data.position}`}
                      ></div>
                      <span className="text-sm font-semibold text-slate-100">{data.position}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-200 font-medium">{data.count}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-slate-100">
                      {formatCurrency(data.totalSalary)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-200">
                      {formatCurrency(data.totalSalary / data.count)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-100">{data.percentage}%</span>
                      <div className="w-16 bg-slate-600 rounded-full h-2 hidden sm:block">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(parseFloat(data.percentage), 100)}%`,
                            backgroundColor: getPositionColor(data.position),
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

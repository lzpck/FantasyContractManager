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
import { 
  formatCurrency, 
  formatPercentage, 
  calculateCapUsagePercentage, 
  getCurrencyClasses,
  CURRENCY_CONSTANTS 
} from '@/utils/formatUtils';

interface CapProjectionChartProps {
  /** Time para projeção */
  team: Team;
  /** Lista de jogadores com contratos */
  players: PlayerWithContract[];
}

/**
 * Função utilitária para garantir valores numéricos válidos
 * Evita NaN, null, undefined e valores inválidos
 */
function safeNumber(value: number | null | undefined, fallback: number = 0): number {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  return value;
}

/**
 * Componente de gráfico de projeção de salary cap
 *
 * Exibe um gráfico de barras mostrando as projeções
 * de salary cap para as próximas temporadas.
 * 
 * Características:
 * - Cálculos seguros que evitam NaN
 * - Layout responsivo e acessível
 * - Cores contextuais para diferentes situações
 * - Alertas inteligentes baseados nas projeções
 */
export function CapProjectionChart({ team, players }: CapProjectionChartProps) {
  const currentYear = new Date().getFullYear();
  const salaryCap = CURRENCY_CONSTANTS.DEFAULT_SALARY_CAP;

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
      if (contract && contract.yearsRemaining > year) {
        // Aplicar aumento de 15% por ano (garantindo valores seguros)
        const baseSalary = safeNumber(contract.currentSalary, 0);
        const projectedSalary = baseSalary * Math.pow(1.15, year);
        totalSalaries += projectedSalary;
        contractsCount++;
      }
    });

    // Dead money (apenas no primeiro ano após corte) - valores seguros
    if (year === 0) {
      deadMoney = safeNumber(team.currentDeadMoney, 0);
    } else if (year === 1) {
      deadMoney = safeNumber(team.nextSeasonDeadMoney, 0);
    }

    // Garantir que todos os cálculos sejam seguros
    const safeTotalSalaries = safeNumber(totalSalaries, 0);
    const safeDeadMoney = safeNumber(deadMoney, 0);
    const totalCommitted = safeTotalSalaries + safeDeadMoney;
    const availableCap = salaryCap - totalCommitted;
    const capUsagePercentage = calculateCapUsagePercentage(totalCommitted, salaryCap);

    projectionData.push({
      year: seasonYear,
      yearLabel: year === 0 ? 'Atual' : `+${year}`,
      totalSalaries: safeTotalSalaries,
      deadMoney: safeDeadMoney,
      totalCommitted,
      availableCap,
      capUsagePercentage,
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
      const usagePercentage = calculateCapUsagePercentage(data.totalSalaries + data.deadMoney, salaryCap);
      const isOverCap = usagePercentage >= 1;
      const isCritical = usagePercentage >= 0.95;
      
      return (
        <div className="bg-slate-900 p-4 border border-slate-600 rounded-xl shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-slate-100 text-base">{label}</p>
            <div className={`px-2 py-1 rounded-full text-xs font-bold ${
              isOverCap 
                ? 'bg-red-500 text-white' 
                : isCritical 
                  ? 'bg-orange-500 text-white'
                  : 'bg-green-500 text-white'
            }`}>
              {formatPercentage(usagePercentage)}
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Salários:</span>
              <span className="text-blue-400 font-medium font-mono">{formatCurrency(data.totalSalaries)}</span>
            </div>
            
            {data.deadMoney > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Dead Money:</span>
                <span className="text-red-400 font-medium font-mono">{formatCurrency(data.deadMoney)}</span>
              </div>
            )}
            
            <div className="border-t border-slate-700 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Total Comprometido:</span>
                <span className="text-slate-100 font-bold font-mono">{formatCurrency(data.totalSalaries + data.deadMoney)}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Cap Disponível:</span>
              <span className={`font-bold font-mono ${
                data.availableCap >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(data.availableCap)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Contratos Ativos:</span>
              <span className="text-slate-300 font-medium">{data.contractsCount}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Salary Cap:</span>
              <span className="text-slate-300 font-mono">{formatCurrency(salaryCap)}</span>
            </div>
          </div>
          
          {isOverCap && (
            <div className="mt-3 p-2 bg-red-900/50 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-xs font-medium">⚠️ Acima do salary cap!</p>
            </div>
          )}
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
    <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-100">Projeção de Salary Cap</h3>
        <div className="text-xs text-slate-400 hidden sm:block">
          Próximas 4 temporadas
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-64 sm:h-80 mb-4 sm:mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
            <XAxis 
              dataKey="yearLabel" 
              tick={{ fontSize: 12, fill: '#94a3b8' }} 
              stroke="#64748b" 
              axisLine={{ stroke: '#64748b' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              stroke="#64748b"
              axisLine={{ stroke: '#64748b' }}
              tickFormatter={value => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Linha de referência do salary cap */}
            <ReferenceLine
              y={salaryCap}
              stroke="#ef4444"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ 
                value: `Salary Cap (${formatCurrency(salaryCap)})`, 
                position: 'topRight',
                style: { fill: '#ef4444', fontSize: '12px', fontWeight: 'bold' }
              }}
            />

            {/* Barras com cores contextuais */}
            <Bar 
              dataKey="totalSalaries" 
              stackId="committed" 
              fill="#3b82f6" 
              name="Salários"
              radius={[0, 0, 4, 4]}
            />
            <Bar 
              dataKey="deadMoney" 
              stackId="committed" 
              fill="#dc2626" 
              name="Dead Money"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda */}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-700/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded shadow-sm"></div>
          <span className="text-sm text-slate-300 font-medium">Salários dos Contratos</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-600 rounded shadow-sm"></div>
          <span className="text-sm text-slate-300 font-medium">Dead Money</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-2 border-2 border-red-500 border-dashed rounded-sm"></div>
          <span className="text-sm text-slate-300 font-medium">Limite do Salary Cap</span>
        </div>
      </div>

      {/* Tabela de Resumo */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-700/30 border-b border-slate-600/50">
                <th className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wide py-3 px-4">
                  Temporada
                </th>
                <th className="text-center text-xs font-semibold text-slate-300 uppercase tracking-wide py-3 px-4 hidden sm:table-cell">
                  Contratos
                </th>
                <th className="text-right text-xs font-semibold text-slate-300 uppercase tracking-wide py-3 px-4">
                  Salários
                </th>
                <th className="text-right text-xs font-semibold text-slate-300 uppercase tracking-wide py-3 px-4 hidden md:table-cell">
                  Dead Money
                </th>
                <th className="text-right text-xs font-semibold text-slate-300 uppercase tracking-wide py-3 px-4">
                  Total
                </th>
                <th className="text-right text-xs font-semibold text-slate-300 uppercase tracking-wide py-3 px-4">
                  Disponível
                </th>
                <th className="text-center text-xs font-semibold text-slate-300 uppercase tracking-wide py-3 px-4">
                  Uso %
                </th>
              </tr>
            </thead>
          <tbody className="divide-y divide-slate-600/30">
            {projectionData.map((data, index) => {
              const isCurrentYear = index === 0;
              const usagePercentage = data.capUsagePercentage;
              const isOverCap = usagePercentage >= 1;
              const isCritical = usagePercentage >= 0.95;
              const isWarning = usagePercentage >= 0.85;
              const hasDeadMoney = data.deadMoney > 0;
              
              return (
                <tr 
                   key={data.year} 
                   className={`${
                     isCurrentYear 
                       ? 'bg-blue-500/10 border-l-2 border-l-blue-500' 
                       : 'hover:bg-slate-700/30'
                   } transition-all duration-200`}
                   aria-label={`Projeção para ${data.year}${isCurrentYear ? ' (ano atual)' : ''}`}
                 >
                   <td className="py-3 px-4 font-medium text-slate-100">
                     <div className="flex items-center space-x-2">
                       <span className="text-sm">{data.year}</span>
                       {isCurrentYear && (
                         <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                           Atual
                         </span>
                       )}
                     </div>
                   </td>
                   <td className="py-3 px-4 text-center text-slate-300 text-sm hidden sm:table-cell" aria-label={`${data.contractsCount} contratos ativos`}>
                     {data.contractsCount}
                   </td>
                   <td className="py-3 px-4 text-right text-slate-300 font-mono text-sm" aria-label={`Salários: ${formatCurrency(data.totalSalaries)}`}>
                     {formatCurrency(data.totalSalaries)}
                   </td>
                   <td className="py-3 px-4 text-right font-mono text-sm hidden md:table-cell" aria-label={hasDeadMoney ? `Dead money: ${formatCurrency(data.deadMoney)}` : 'Sem dead money'}>
                     {hasDeadMoney ? (
                       <span className="text-red-400 font-medium">
                         {formatCurrency(data.deadMoney)}
                       </span>
                     ) : (
                       <span className="text-slate-500">—</span>
                     )}
                   </td>
                   <td className="py-3 px-4 text-right font-medium font-mono text-slate-100 text-sm" aria-label={`Total comprometido: ${formatCurrency(data.totalCommitted)}`}>
                     {formatCurrency(data.totalCommitted)}
                   </td>
                   <td className={`py-3 px-4 text-right font-medium font-mono text-sm ${
                     data.availableCap >= 0 
                       ? 'text-green-400' 
                       : 'text-red-400'
                   }`} aria-label={`Cap disponível: ${formatCurrency(data.availableCap)}`}>
                     {formatCurrency(data.availableCap)}
                   </td>
                   <td className="py-3 px-4 text-center" aria-label={`Uso do cap: ${formatPercentage(usagePercentage)}`}>
                     <div className="flex items-center justify-center space-x-2">
                       <span className={`font-medium font-mono text-sm ${
                         isOverCap
                           ? 'text-red-400'
                           : isCritical
                             ? 'text-orange-400'
                             : isWarning
                               ? 'text-yellow-400'
                               : 'text-green-400'
                       }`}>
                         {formatPercentage(usagePercentage)}
                       </span>
                       <div className="flex space-x-1">
                         {isOverCap && (
                           <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full" title="Acima do salary cap" aria-label="Acima do salary cap">
                             !
                           </span>
                         )}
                         {!isOverCap && isCritical && (
                           <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full" title="Uso crítico do salary cap" aria-label="Uso crítico do salary cap">
                             ⚠
                           </span>
                         )}
                         {hasDeadMoney && data.deadMoney > 5000000 && (
                           <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-purple-500 rounded-full" title="Alto dead money" aria-label="Alto dead money">
                             D
                           </span>
                         )}
                       </div>
                     </div>
                   </td>
                 </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Alertas */}
      <div className="space-y-3 mt-6">
        {/* Alerta de Cap Excedido */}
        {projectionData.some(d => d.availableCap < 0) && (
          <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-bold text-red-400">Salary Cap Excedido</h3>
                <p className="text-sm text-red-300 mt-1">
                  O time está projetado para exceder o salary cap em {projectionData.filter(d => d.availableCap < 0).length} temporada(s). 
                  Considere cortar jogadores ou renegociar contratos.
                </p>
                <div className="mt-2 text-xs text-red-400">
                  Anos afetados: {projectionData.filter(d => d.availableCap < 0).map(d => d.year).join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Alerta de Uso Crítico */}
        {projectionData.some(d => d.capUsagePercentage >= 0.95 && d.capUsagePercentage < 1) && (
          <div className="p-4 bg-orange-900/20 border border-orange-500/50 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⚠</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-bold text-orange-400">Uso Crítico do Salary Cap</h3>
                <p className="text-sm text-orange-300 mt-1">
                  O time está usando mais de 95% do salary cap em algumas temporadas. Pouco espaço para movimentações.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Alerta de Dead Money Alto */}
        {projectionData.some(d => d.deadMoney > 10000000) && (
          <div className="p-4 bg-purple-900/20 border border-purple-500/50 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">D</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-bold text-purple-400">Alto Dead Money</h3>
                <p className="text-sm text-purple-300 mt-1">
                  O time tem dead money significativo (&gt;$10M) em algumas temporadas, impactando a flexibilidade financeira.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Situação Saudável */}
        {!projectionData.some(d => d.availableCap < 0) && 
         !projectionData.some(d => d.capUsagePercentage >= 0.95) && 
         !projectionData.some(d => d.deadMoney > 10000000) && (
          <div className="p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-bold text-green-400">Situação Financeira Saudável</h3>
                <p className="text-sm text-green-300 mt-1">
                  O time está em boa situação financeira com espaço adequado no salary cap para as próximas temporadas.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

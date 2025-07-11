'use client';

import { TagIcon } from '@heroicons/react/24/outline';
import { POSITION_COLORS } from '@/utils/positionColors';

interface FranchiseTagValue {
  position: string;
  tagValue: number;
  averageTop10: number;
  calculationMethod: 'average' | 'salary_plus_15';
  playerCount: number;
}

interface FranchiseTagValuesProps {
  /** Valores de franchise tag por posição */
  franchiseTagValues: FranchiseTagValue[];
  /** Se está carregando os dados */
  loading?: boolean;
}

/**
 * Componente que exibe os valores de Franchise Tag por posição
 *
 * Calcula e mostra o valor da franchise tag para cada posição baseado na regra:
 * maior valor entre a média dos 10 maiores salários da posição ou salário atual + 15%
 */
export function FranchiseTagValues({
  franchiseTagValues,
  loading = false,
}: FranchiseTagValuesProps) {
  // Ordem específica das posições
  const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB'];

  // Ordenar os valores de franchise tag pela ordem específica
  const sortedFranchiseTagValues = [...franchiseTagValues].sort((a, b) => {
    const indexA = positionOrder.indexOf(a.position);
    const indexB = positionOrder.indexOf(b.position);

    // Se ambas estão na ordem específica, usar a ordem
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // Se apenas uma está na ordem específica, ela vem primeiro
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // Se nenhuma está na ordem específica, ordenar alfabeticamente
    return a.position.localeCompare(b.position);
  });

  // Função para obter cor da posição usando o sistema centralizado
  const getPositionColorStyle = (position: string) => {
    const color = POSITION_COLORS[position] || POSITION_COLORS.DEF;
    return { backgroundColor: color };
  };

  const getMethodText = (method: string) => {
    return method === 'average' ? 'Média Top 10' : 'Salário + 15%';
  };

  const getMethodColor = (method: string) => {
    return method === 'average' ? 'text-blue-400' : 'text-green-400';
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
        <div className="flex items-center mb-4">
          <TagIcon className="h-6 w-6 text-purple-500 mr-2" />
          <h3 className="text-lg font-semibold text-slate-100">Valores de Franchise Tag</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-3 h-3 bg-slate-600 rounded-full mr-2"></div>
                  <div className="h-4 bg-slate-600 rounded w-8"></div>
                </div>
                <div className="h-6 bg-slate-600 rounded w-20 mb-2"></div>
                <div className="h-3 bg-slate-600 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6">
      <div className="flex items-center mb-4">
        <TagIcon className="h-6 w-6 text-purple-500 mr-2" />
        <h3 className="text-lg font-semibold text-slate-100">Valores de Franchise Tag</h3>
      </div>

      <div className="mb-4 text-sm text-slate-400">
        <p>
          Valores calculados pela regra: maior entre média dos 10 maiores salários da posição ou
          salário atual + 15%
        </p>
      </div>

      {franchiseTagValues.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">Nenhum dado de franchise tag disponível</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFranchiseTagValues.map(tagData => (
            <div
              key={tagData.position}
              className="bg-slate-700 rounded-lg p-4 hover:bg-slate-650 transition-colors"
            >
              <div className="flex items-center mb-3">
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={getPositionColorStyle(tagData.position)}
                ></span>
                <h4 className="font-semibold text-slate-100">{tagData.position}</h4>
              </div>

              <div className="mb-3">
                <div className="text-2xl font-bold text-purple-400">
                  ${(tagData.tagValue / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-slate-400">Valor da Tag</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Método:</span>
                  <span className={getMethodColor(tagData.calculationMethod)}>
                    {getMethodText(tagData.calculationMethod)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Média Top 10:</span>
                  <span className="text-slate-300">
                    ${(tagData.averageTop10 / 1000000).toFixed(1)}M
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Jogadores:</span>
                  <span className="text-slate-300">{tagData.playerCount}</span>
                </div>
              </div>

              {tagData.playerCount < 10 && (
                <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs text-yellow-400">
                  ⚠️ Menos de 10 jogadores na posição
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

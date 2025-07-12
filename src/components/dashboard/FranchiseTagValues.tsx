import React from 'react';
import { TagIcon } from '@heroicons/react/24/outline';

interface FranchiseTagData {
  position: string;
  tagValue: number;
  averageTop10: number;
  isBasedOnAverage: boolean; // true se baseado na média, false se baseado em salário atual + 15%
}

interface FranchiseTagValuesProps {
  /** Dados dos valores de Franchise Tag por posição */
  tagData: FranchiseTagData[];
  /** Título do componente */
  title?: string;
}

/**
 * Componente para exibir valores de Franchise Tag por posição
 *
 * Regra de negócio:
 * - Franchise Tag = maior valor entre:
 *   1. Média dos 10 maiores salários da posição
 *   2. Salário atual do jogador + 15%
 * - Só pode ser aplicada após semana 17 até 1º de abril
 * - Jogador não pode ter sido tagueado antes
 * - Máximo de 1 tag por temporada (configurável)
 * - Valor entra em vigor na temporada seguinte
 *
 * Integração futura:
 * - Calcular média dos top 10 por posição da liga selecionada
 * - Considerar apenas contratos ativos
 * - Aplicar regra de maior valor (média vs salário + 15%)
 * - Verificar elegibilidade do jogador (nunca foi tagueado)
 */
export function FranchiseTagValues({
  tagData = [],
  title = 'Valores Franchise Tag',
}: FranchiseTagValuesProps) {
  // Cores por posição (consistente com outros componentes)
  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      QB: 'text-purple-400 bg-purple-900/20 border-purple-700',
      RB: 'text-green-400 bg-green-900/20 border-green-700',
      WR: 'text-blue-400 bg-blue-900/20 border-blue-700',
      TE: 'text-orange-400 bg-orange-900/20 border-orange-700',
      K: 'text-yellow-400 bg-yellow-900/20 border-yellow-700',
      DEF: 'text-red-400 bg-red-900/20 border-red-700',
    };
    return colors[position] || 'text-slate-400 bg-slate-900/20 border-slate-700';
  };

  return (
    <div
      className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-4 sm:p-6 h-full"
      data-testid="franchise-tag-values-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TagIcon className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <div className="text-xs text-slate-400">
          {tagData.length} {tagData.length === 1 ? 'posição' : 'posições'}
        </div>
      </div>

      {/* Explicação da regra */}
      <div className="mb-4 p-3 bg-slate-700 rounded-lg border border-slate-600">
        <p className="text-xs text-slate-300 leading-relaxed">
          <span className="font-medium text-amber-400">Regra:</span> Maior valor entre a média dos
          10 maiores salários da posição ou salário atual + 15%
        </p>
      </div>

      {/* Lista de valores por posição */}
      <div className="space-y-3">
        {tagData.length > 0 ? (
          tagData.map(data => {
            const colorClasses = getPositionColor(data.position);

            return (
              <div
                key={data.position}
                className="p-3 bg-slate-700 rounded-lg border border-slate-600 hover:bg-slate-650 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium border ${colorClasses}`}
                  >
                    {data.position}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-amber-400 text-lg">
                      ${(data.tagValue / 1000000).toFixed(1)}M
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {data.isBasedOnAverage ? 'Baseado na média top 10' : 'Baseado em salário + 15%'}
                  </span>
                  <span>Média: ${(data.averageTop10 / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <TagIcon className="h-12 w-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Nenhum dado disponível</p>
            <p className="text-sm text-slate-500 mt-1">
              Selecione uma liga para visualizar valores de Franchise Tag
            </p>
          </div>
        )}
      </div>

      {/* Informações adicionais */}
      <div className="mt-4 pt-3 border-t border-slate-600">
        <div className="text-xs text-slate-500 space-y-1">
          <p>• Aplicável após semana 17 até 1º de abril</p>
          <p>• Jogador não pode ter sido tagueado antes</p>
          <p>• Máximo de 1 tag por temporada</p>
        </div>
      </div>
    </div>
  );
}

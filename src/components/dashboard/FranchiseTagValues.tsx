import React from 'react';
import { TagIcon } from '@heroicons/react/24/outline';
import { getPositionTailwindClasses } from '@/utils/positionColors';

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
  // Ordem padrão das posições
  const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DL', 'LB', 'DB'];
  
  // Ordenar dados por posição
  const sortedTagData = [...tagData].sort((a, b) => {
    const posA = positionOrder.indexOf(a.position);
    const posB = positionOrder.indexOf(b.position);
    
    // Se ambas as posições estão na lista, ordenar por posição
    if (posA !== -1 && posB !== -1) {
      return posA - posB;
    }
    // Se apenas uma está na lista, ela vem primeiro
    else if (posA !== -1) return -1;
    else if (posB !== -1) return 1;
    
    // Se nenhuma está na lista, ordenar alfabeticamente
    return a.position.localeCompare(b.position);
  });

  return (
    <div
      className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-4 sm:p-6 h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:border-slate-600"
      data-testid="franchise-tag-values-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-900/30 rounded-lg">
            <TagIcon className="h-5 w-5 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <div className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-full">
          {tagData.length} {tagData.length === 1 ? 'posição' : 'posições'}
        </div>
      </div>

      {/* Lista de valores por posição - área flexível com scroll */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {sortedTagData.length > 0 ? (
          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {sortedTagData.map((data, index) => {
              const colorClasses = getPositionTailwindClasses(data.position);
              const tagValue = isNaN(data.tagValue) || data.tagValue === 0 ? 0 : data.tagValue;
              const avgValue = isNaN(data.averageTop10) || data.averageTop10 === 0 ? 0 : data.averageTop10;
              const percentage = tagValue > 0 ? Math.min((tagValue / 50000000) * 100, 100) : 0; // Normalizado para 50M max
              
              return (
                <div
                  key={data.position}
                  className="p-3 bg-slate-700 rounded-lg border border-slate-600 hover:bg-slate-650 hover:border-slate-500 transition-all duration-200 hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${colorClasses}`}
                    >
                      {data.position}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-400 text-lg">
                        $
                        {tagValue === 0 ? '0.0' : (tagValue / 1000000).toFixed(1)}
                        M
                      </div>
                    </div>
                  </div>
                  
                  {/* Mini gráfico de barra */}
                  <div className="mb-2">
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {data.isBasedOnAverage ? 'Baseado na média top 10' : 'Baseado em salário + 15%'}
                    </span>
                    <span>
                      Média: $
                      {avgValue === 0 ? '0.0' : (avgValue / 1000000).toFixed(1)}
                      M
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* Espaço decorativo se houver poucas posições */}
            {tagData.length < 6 && (
              <div className="flex-1 flex items-end justify-center pb-4">
                <div className="text-center text-slate-500">
                  <div className="w-16 h-16 mx-auto mb-2 bg-slate-700/50 rounded-full flex items-center justify-center">
                    <TagIcon className="h-8 w-8 text-slate-500" />
                  </div>
                  <p className="text-xs">Mais posições disponíveis</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
                <TagIcon className="h-10 w-10 text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">Nenhum dado disponível</p>
              <p className="text-sm text-slate-500 mt-1">
                Selecione uma liga para visualizar valores de Franchise Tag
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Informações adicionais sobre Franchise Tag - rodapé fixo */}
      <div className="mt-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600 flex-shrink-0">
        <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
          <span className="text-purple-400">📋</span>
          Regras da Franchise Tag
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
            <span>Aplicável após semana 17</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
            <span>Máximo 1 tag/temporada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
            <span>Jogador não pode ter sido tagueado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
            <span>Maior: média top 10 ou +15%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

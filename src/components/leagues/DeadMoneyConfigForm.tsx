'use client';

import React, { useState, useEffect } from 'react';
import { DeadMoneyConfig, DEFAULT_DEAD_MONEY_CONFIG } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export interface DeadMoneyConfigFormProps {
  /** Configuração atual de dead money */
  config: DeadMoneyConfig;
  /** Callback chamado quando a configuração é alterada */
  onChange: (config: DeadMoneyConfig) => void;
  /** Se o formulário está em modo de edição */
  disabled?: boolean;
  compact?: boolean;
  /** Variante de visualização: 'card' (padrão) usa cards com fundo, 'clean' usa apenas layout sem fundo */
  variant?: 'card' | 'clean';
}

/**
 * Componente para configuração de regras de dead money por liga
 */
export function DeadMoneyConfigForm({
  config,
  onChange,
  disabled = false,
  compact = false,
  variant = 'card', // This prop is less relevant now as we control styling, but keeping for compatibility
}: DeadMoneyConfigFormProps) {
  const [localConfig, setLocalConfig] = useState<DeadMoneyConfig>(config);
  const [showPreview, setShowPreview] = useState(false);

  // Sincronizar com prop externa
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Atualizar configuração local e notificar parent
  const updateConfig = (newConfig: DeadMoneyConfig) => {
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  // Resetar para configuração padrão
  const resetToDefault = () => {
    updateConfig(DEFAULT_DEAD_MONEY_CONFIG);
  };

  // Validar se percentual está entre 0 e 1
  const validatePercentage = (value: number): boolean => {
    return value >= 0 && value <= 1;
  };

  // Calcular preview de dead money para um exemplo
  const calculatePreview = (salary: number, yearsRemaining: number) => {
    const currentSeason = salary * localConfig.currentSeason;
    const futureSeasons =
      yearsRemaining > 0
        ? salary *
          (localConfig.futureSeasons[
            Math.min(yearsRemaining, 4).toString() as keyof typeof localConfig.futureSeasons
          ] || 0) *
          yearsRemaining
        : 0;
    return { currentSeason, futureSeasons, total: currentSeason + futureSeasons };
  };

  return (
    <div className="space-y-8">
      {/* Header with Reset Button */}
      {!compact && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetToDefault}
            disabled={disabled}
            className="text-slate-400 hover:text-slate-200"
          >
            Resetar para Padrão
          </Button>
        </div>
      )}

      {/* Grid Layout for Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Current Season Column */}
        <div className="space-y-4">
          <div className="border-b border-slate-700 pb-2 mb-4">
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Temporada Atual
            </h4>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Percentual de Impacto Imediato
            </label>
            <div className="flex items-center space-x-3">
              <div className="relative w-32">
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={localConfig.currentSeason}
                  onChange={e => {
                    const value = parseFloat(e.target.value) || 0;
                    if (validatePercentage(value)) {
                      updateConfig({ ...localConfig, currentSeason: value });
                    }
                  }}
                  disabled={disabled}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <span className="text-slate-400 text-sm font-mono">
                = {(localConfig.currentSeason * 100).toFixed(0)}%
              </span>
            </div>
            {!validatePercentage(localConfig.currentSeason) && (
              <p className="text-red-400 text-xs mt-1">Valor deve estar entre 0.0 e 1.0</p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Porcentagem do salário do ano vigente que se torna Dead Money.
            </p>
          </div>
        </div>

        {/* Future Seasons Column */}
        <div className="space-y-4">
          <div className="border-b border-slate-700 pb-2 mb-4">
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Temporadas Futuras
            </h4>
          </div>

          <div className="space-y-4">
            {Object.entries(localConfig.futureSeasons).map(([years, percentage]) => (
              <div key={years} className="grid grid-cols-[100px_1fr] items-center gap-4">
                <label className="text-xs font-medium text-slate-400">
                  {years} ano{years !== '1' ? 's' : ''} rest.
                </label>
                <div className="flex items-center space-x-3">
                  <div className="relative w-24">
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={percentage}
                      onChange={e => {
                        const value = parseFloat(e.target.value) || 0;
                        if (validatePercentage(value)) {
                          updateConfig({
                            ...localConfig,
                            futureSeasons: {
                              ...localConfig.futureSeasons,
                              [years]: value,
                            },
                          });
                        }
                      }}
                      disabled={disabled}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <span className="text-slate-400 text-sm font-mono">
                    {(percentage * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Porcentagem sobre os salários acumulados dos anos restantes.
          </p>
        </div>
      </div>

      {/* Preview Section Toggle */}
      {!compact && (
        <div className="pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center gap-2"
          >
            {showPreview ? 'Ocultar Simulação' : 'Simular Impacto Financeiro'}
          </button>
        </div>
      )}

      {/* Impact Preview */}
      {!compact && showPreview && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 animate-in fade-in-50 slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-4 text-slate-300">
            <AlertCircle className="h-4 w-4" />
            <h4 className="text-sm font-medium">Simulação: Corte de Jogador com Salário de $10M</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(years => {
              const preview = calculatePreview(10000000, years);
              return (
                <div
                  key={years}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
                >
                  <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                    {years} ano{years !== 1 ? 's' : ''} restante{years !== 1 ? 's' : ''}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Atual:</span>
                      <span className="text-slate-200 font-mono">
                        {formatCurrency(preview.currentSeason)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Futuro:</span>
                      <span className="text-slate-200 font-mono">
                        {formatCurrency(preview.futureSeasons)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                      <span className="text-slate-300 font-medium">Total:</span>
                      <span className="text-white font-mono font-bold">
                        {formatCurrency(preview.total)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { DeadMoneyConfig, DEFAULT_DEAD_MONEY_CONFIG } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';

interface DeadMoneyConfigFormProps {
  /** Configuração atual de dead money */
  config: DeadMoneyConfig;
  /** Callback chamado quando a configuração é alterada */
  onChange: (config: DeadMoneyConfig) => void;
  /** Se o formulário está em modo de edição */
  disabled?: boolean;
  compact?: boolean;
}

/**
 * Componente para configuração de regras de dead money por liga
 */
export function DeadMoneyConfigForm({
  config,
  onChange,
  disabled = false,
  compact = false,
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
    <div className="space-y-6">
      {/* Cabeçalho - só mostra quando não está em modo compacto */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Configuração de Dead Money</h3>
            <p className="text-sm text-slate-400 mt-1">
              Defina os percentuais aplicados ao cortar jogadores conforme anos restantes de
              contrato
            </p>
          </div>
          <button
            type="button"
            onClick={resetToDefault}
            disabled={disabled}
            className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Resetar Padrão
          </button>
        </div>
      )}

      {/* Botão de resetar para modo compacto */}
      {compact && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={resetToDefault}
            disabled={disabled}
            className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Resetar Padrão
          </button>
        </div>
      )}

      {/* Configuração da temporada atual */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="text-md font-medium text-slate-200 mb-3">Temporada Atual</h4>
        <div className="space-y-2">
          <label className="block text-sm text-slate-300">
            Percentual do salário atual que vira dead money
          </label>
          <div className="flex items-center space-x-3">
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
              className="w-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className="text-slate-400 text-sm">
              ({(localConfig.currentSeason * 100).toFixed(0)}%)
            </span>
            {!validatePercentage(localConfig.currentSeason) && (
              <span className="text-red-400 text-sm">Valor deve estar entre 0 e 1</span>
            )}
          </div>
        </div>
      </div>

      {/* Configuração de temporadas futuras */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="text-md font-medium text-slate-200 mb-3">Temporadas Futuras</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(localConfig.futureSeasons).map(([years, percentage]) => (
            <div key={years} className="space-y-2">
              <label className="block text-sm text-slate-300">
                {years} ano{years !== '1' ? 's' : ''} restante{years !== '1' ? 's' : ''}
              </label>
              <div className="flex items-center space-x-3">
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
                  className="w-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-slate-400 text-sm">({(percentage * 100).toFixed(0)}%)</span>
                {!validatePercentage(percentage) && (
                  <span className="text-red-400 text-sm">Valor deve estar entre 0 e 1</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botão para mostrar/ocultar preview - apenas no modo não-compact */}
      {!compact && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            {showPreview ? 'Ocultar' : 'Mostrar'} Preview de Impacto
          </button>
        </div>
      )}

      {/* Preview de impacto - apenas no modo não-compact */}
      {!compact && showPreview && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-md font-medium text-slate-200 mb-3">Preview de Impacto</h4>
          <p className="text-sm text-slate-400 mb-4">
            Exemplos de dead money para um jogador com salário de $10M:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(years => {
              const preview = calculatePreview(10000000, years);
              return (
                <div key={years} className="bg-slate-700 rounded-lg p-3">
                  <div className="text-sm font-medium text-slate-200 mb-2">
                    {years} ano{years !== 1 ? 's' : ''} restante{years !== 1 ? 's' : ''}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Atual:</span>
                      <span className="text-slate-200">
                        {formatCurrency(preview.currentSeason)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Futuro:</span>
                      <span className="text-slate-200">
                        {formatCurrency(preview.futureSeasons)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-600 pt-1">
                      <span className="text-slate-300 font-medium">Total:</span>
                      <span className="text-slate-100 font-medium">
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

      {/* Explicação das regras - apenas no modo não-compact */}
      {!compact && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-200 mb-2">📋 Como funciona o Dead Money</h4>
          <div className="text-sm text-blue-100 space-y-1">
            <p>
              • <strong>Temporada Atual:</strong> Percentual do salário do ano que vira dead money
              imediatamente
            </p>
            <p>
              • <strong>Temporadas Futuras:</strong> Percentual aplicado aos salários dos anos
              restantes, pago na próxima temporada
            </p>
            <p>
              • <strong>Practice Squad:</strong> Sempre 25% do salário atual, independente da
              configuração
            </p>
            <p>
              • <strong>Valores:</strong> 0.0 = 0%, 0.5 = 50%, 1.0 = 100%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

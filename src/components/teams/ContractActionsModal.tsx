'use client';

import { useState } from 'react';
import { PlayerWithContract } from '@/types';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ContractActionsModalProps {
  /** Jogador selecionado */
  player: PlayerWithContract;
  /** Função chamada ao fechar o modal */
  onClose: () => void;
  /** Função chamada ao executar uma ação */
  onAction: (action: string) => void;
}

/**
 * Modal de ações de contrato
 *
 * Permite executar ações como editar, estender, taguear
 * ou cortar um jogador, com formulários específicos.
 */
export function ContractActionsModal({ player, onClose, onAction }: ContractActionsModalProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'extend' | 'tag' | 'cut'>('edit');
  const [formData, setFormData] = useState({
    newSalary: player.contract.currentSalary,
    newYears: 1,
    tagValue: 0,
  });

  // Função para formatar valores monetários
  const formatMoney = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  // Calcular dead money se cortado
  const calculateDeadMoney = () => {
    const remainingSalary = player.contract.currentSalary * player.contract.yearsRemaining;
    return remainingSalary * 0.25; // 25% do salário restante
  };

  // Calcular valor da franchise tag
  const calculateTagValue = () => {
    const salaryIncrease = player.contract.currentSalary * 1.15;
    const positionAverage = player.contract.currentSalary * 1.2; // Mock da média da posição
    return Math.max(salaryIncrease, positionAverage);
  };

  // Verificar elegibilidade para ações
  const isEligibleForExtension =
    player.contract.yearsRemaining === 1 && !player.contract.hasBeenExtended;
  const isEligibleForTag = player.contract.yearsRemaining === 1 && !player.contract.hasBeenTagged;

  const handleSubmit = (action: string) => {
    onAction(action);
  };

  const tabs = [
    { id: 'edit', label: 'Editar Contrato', enabled: true },
    { id: 'extend', label: 'Extensão', enabled: isEligibleForExtension },
    { id: 'tag', label: 'Franchise Tag', enabled: isEligibleForTag },
    { id: 'cut', label: 'Cortar Jogador', enabled: true },
  ] as const;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Ações de Contrato - {player.player.name}
            </h3>
            <p className="text-sm text-gray-600">
              {player.player.position} • {player.player.nflTeam} •{' '}
              {formatMoney(player.contract.currentSalary)} • {player.contract.yearsRemaining} ano(s)
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => tab.enabled && setActiveTab(tab.id)}
                  disabled={!tab.enabled}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : tab.enabled
                        ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        : 'border-transparent text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {tab.label}
                  {!tab.enabled && ' (Indisponível)'}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {/* Editar Contrato */}
          {activeTab === 'edit' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salário Atual (em milhões)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.newSalary}
                  onChange={e =>
                    setFormData({ ...formData, newSalary: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anos Restantes
                </label>
                <select
                  value={player.contract.yearsRemaining}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                >
                  <option>{player.contract.yearsRemaining}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Anos restantes não podem ser alterados diretamente
                </p>
              </div>
              <button
                onClick={() => handleSubmit('edit')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          )}

          {/* Extensão de Contrato */}
          {activeTab === 'extend' && (
            <div className="space-y-4">
              {isEligibleForExtension ? (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Extensão de Contrato</h4>
                    <p className="text-sm text-blue-700">
                      O jogador está no último ano de contrato e é elegível para extensão. A
                      extensão entrará em vigor na próxima temporada.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Novo Salário (em milhões)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.newSalary}
                      onChange={e =>
                        setFormData({ ...formData, newSalary: parseFloat(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Novos Anos
                    </label>
                    <select
                      value={formData.newYears}
                      onChange={e =>
                        setFormData({ ...formData, newYears: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={1}>1 ano</option>
                      <option value={2}>2 anos</option>
                      <option value={3}>3 anos</option>
                      <option value={4}>4 anos</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleSubmit('extend')}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Aplicar Extensão
                  </button>
                </>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600">Jogador não é elegível para extensão de contrato.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Apenas jogadores no último ano que nunca foram estendidos são elegíveis.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Franchise Tag */}
          {activeTab === 'tag' && (
            <div className="space-y-4">
              {isEligibleForTag ? (
                <>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Franchise Tag</h4>
                    <p className="text-sm text-purple-700">
                      Aplicar franchise tag garante o jogador por mais um ano. O valor será o maior
                      entre salário +15% ou média dos top 10 da posição.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Salário Atual + 15%:</p>
                        <p className="font-medium">
                          {formatMoney(player.contract.currentSalary * 1.15)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Média Top 10 {player.player.position}:</p>
                        <p className="font-medium">{formatMoney(calculateTagValue())}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-gray-600">Valor da Tag:</p>
                      <p className="text-lg font-bold text-purple-600">
                        {formatMoney(calculateTagValue())}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSubmit('tag')}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Aplicar Franchise Tag
                  </button>
                </>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600">Jogador não é elegível para franchise tag.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Apenas jogadores no último ano que nunca foram tagueados são elegíveis.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cortar Jogador */}
          {activeTab === 'cut' && (
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Cortar Jogador</h4>
                <p className="text-sm text-red-700">
                  Ao cortar o jogador, você pagará dead money baseado no contrato restante. Esta
                  ação não pode ser desfeita.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Salário Atual:</span>
                    <span className="font-medium">
                      {formatMoney(player.contract.currentSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Anos Restantes:</span>
                    <span className="font-medium">{player.contract.yearsRemaining}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Salário Total Restante:</span>
                    <span className="font-medium">
                      {formatMoney(player.contract.currentSalary * player.contract.yearsRemaining)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-red-600 font-medium">Dead Money Estimado:</span>
                      <span className="font-bold text-red-600">
                        {formatMoney(calculateDeadMoney())}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <strong>Atenção:</strong> O dead money será aplicado ao salary cap da temporada
                  atual e próxima. Certifique-se de que tem cap suficiente disponível.
                </p>
              </div>
              <button
                onClick={() => handleSubmit('cut')}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Confirmar Corte do Jogador
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

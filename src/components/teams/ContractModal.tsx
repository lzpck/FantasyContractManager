'use client';

import { useState, useEffect } from 'react';
import { Player, Contract, AcquisitionType, League, Team } from '@/types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/utils/formatUtils';

interface ContractFormData {
  contractYears: number;
  annualSalary: number;
  acquisitionType: AcquisitionType;
  hasFourthYearOption: boolean;
  hasBeenTagged: boolean;
  hasBeenExtended: boolean;
  fourthYearOptionActivated: boolean;
}

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  team: Team | null;
  league: League | null;
  contract?: Contract | null; // Para edição
  onSave: (contractData: ContractFormData) => void;
  isCommissioner: boolean;
}

export default function ContractModal({
  isOpen,
  onClose,
  player,
  team,
  league,
  contract,
  onSave,
  isCommissioner,
}: ContractModalProps) {
  const [formData, setFormData] = useState<ContractFormData>({
    contractYears: 1,
    annualSalary: 1000000, // 1 milhão como padrão
    acquisitionType: AcquisitionType.AUCTION,
    hasFourthYearOption: false,
    hasBeenTagged: false,
    hasBeenExtended: false,
    fourthYearOptionActivated: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [projectedValues, setProjectedValues] = useState<number[]>([]);

  const isEditMode = !!contract;
  const isRookieAcquisition = formData.acquisitionType === AcquisitionType.ROOKIE_DRAFT;

  // Resetar formulário quando o modal abrir/fechar
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && contract) {
        // Modo edição: preencher com dados do contrato existente
        setFormData({
          contractYears: contract.originalYears,
          annualSalary: contract.originalSalary,
          acquisitionType: contract.acquisitionType,
          hasFourthYearOption: contract.hasFourthYearOption,
          hasBeenTagged: contract.hasBeenTagged,
          hasBeenExtended: contract.hasBeenExtended,
          fourthYearOptionActivated: contract.fourthYearOptionActivated,
        });
      } else {
        // Modo criação: valores padrão
        setFormData({
          contractYears: 1,
          annualSalary: league?.minimumSalary || 1000000,
          acquisitionType: AcquisitionType.AUCTION,
          hasFourthYearOption: false,
          hasBeenTagged: false,
          hasBeenExtended: false,
          fourthYearOptionActivated: false,
        });
      }
      setErrors({});
    }
  }, [isOpen, isEditMode, contract, league]);

  // Calcular projeção de valores com aumento anual
  useEffect(() => {
    if (league && formData.annualSalary > 0) {
      const values = [];
      let currentValue = formData.annualSalary;
      
      for (let year = 1; year <= formData.contractYears; year++) {
        values.push(currentValue);
        if (year < formData.contractYears) {
          currentValue = currentValue * (1 + league.annualIncreasePercentage / 100);
        }
      }
      
      setProjectedValues(values);
    }
  }, [formData.annualSalary, formData.contractYears, league]);

  // Validações
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar salário mínimo
    if (league && formData.annualSalary < league.minimumSalary) {
      newErrors.annualSalary = `Salário não pode ser menor que ${formatCurrency(league.minimumSalary)}`;
    }

    // Validar anos do contrato
    if (formData.contractYears < 1 || formData.contractYears > 4) {
      newErrors.contractYears = 'Contrato deve ter entre 1 e 4 anos';
    }

    // Validar tipo de aquisição
    if (!formData.acquisitionType) {
      newErrors.acquisitionType = 'Tipo de aquisição é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData);
    onClose();
  };

  const handleInputChange = (field: keyof ContractFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Não renderizar se não for comissário ou modal fechado
  if (!isOpen || !isCommissioner || !player || !team || !league) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-3xl bg-slate-800 rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
          <div>
            <h3 className="text-xl font-semibold text-slate-100">
              {isEditMode ? 'Editar Contrato' : 'Adicionar Contrato'}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {player.name} • {player.position} • {player.nflTeam} • {team.name}
            </p>
            {isEditMode && contract && (
              <p className="text-xs text-slate-500 mt-1">
                Anos restantes: {contract.yearsRemaining} • Temporada assinada: {contract.signedSeason}
              </p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Anos de Contrato */}
            <div>
              <label className="block text-sm font-medium text-slate-100 mb-2">
                Anos de Contrato *
              </label>
              <select
                value={formData.contractYears}
                onChange={(e) => handleInputChange('contractYears', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700 text-slate-100 ${
                  errors.contractYears ? 'border-red-500' : 'border-slate-600'
                }`}
              >
                <option value={1}>1 ano</option>
                <option value={2}>2 anos</option>
                <option value={3}>3 anos</option>
                <option value={4}>4 anos</option>
              </select>
              {errors.contractYears && (
                <p className="text-red-400 text-xs mt-1">{errors.contractYears}</p>
              )}
            </div>

            {/* Valor Anual Inicial */}
            <div>
              <label className="block text-sm font-medium text-slate-100 mb-2">
                Valor Anual Inicial (milhões) *
              </label>
              <input
                type="number"
                step="0.1"
                min={league.minimumSalary}
                value={formData.annualSalary}
                onChange={(e) => handleInputChange('annualSalary', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700 text-slate-100 ${
                  errors.annualSalary ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder={`Mínimo: ${league.minimumSalary}`}
              />
              {errors.annualSalary && (
                <p className="text-red-400 text-xs mt-1">{errors.annualSalary}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                Salário mínimo da liga: {formatCurrency(league.minimumSalary)}
              </p>
            </div>
          </div>

          {/* Tipo de Aquisição */}
          <div>
            <label className="block text-sm font-medium text-slate-100 mb-2">
              Tipo de Aquisição *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(AcquisitionType).map((type) => (
                <label key={type} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="acquisitionType"
                    value={type}
                    checked={formData.acquisitionType === type}
                    onChange={(e) => handleInputChange('acquisitionType', e.target.value as AcquisitionType)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-300">
                    {type === AcquisitionType.AUCTION && 'Leilão'}
                    {type === AcquisitionType.FAAB && 'FAAB/Waiver'}
                    {type === AcquisitionType.ROOKIE_DRAFT && 'Rookie Draft'}
                    {type === AcquisitionType.TRADE && 'Trade'}
                    {type === AcquisitionType.UNDISPUTED && 'Não Disputado'}
                  </span>
                </label>
              ))}
            </div>
            {errors.acquisitionType && (
              <p className="text-red-400 text-xs mt-1">{errors.acquisitionType}</p>
            )}
          </div>

          {/* Opções específicas para Rookies */}
          {isRookieAcquisition && (
            <div className="bg-slate-700 p-4 rounded-xl">
              <h4 className="text-sm font-medium text-slate-100 mb-3">Opções de Rookie</h4>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasFourthYearOption}
                  onChange={(e) => handleInputChange('hasFourthYearOption', e.target.checked)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-300">
                  Tem opção de quarto ano (apenas para picks do 1º round)
                </span>
              </label>
            </div>
          )}

          {/* Campos de Edição */}
          {isEditMode && (
            <div className="bg-slate-700 p-4 rounded-xl">
              <h4 className="text-sm font-medium text-slate-100 mb-3">Opções do Comissário</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasBeenTagged}
                    onChange={(e) => handleInputChange('hasBeenTagged', e.target.checked)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-300">
                    Já foi tagueado (Franchise Tag)
                  </span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasBeenExtended}
                    onChange={(e) => handleInputChange('hasBeenExtended', e.target.checked)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-300">
                    Já recebeu extensão de contrato
                  </span>
                </label>

                {formData.hasFourthYearOption && (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.fourthYearOptionActivated}
                      onChange={(e) => handleInputChange('fourthYearOptionActivated', e.target.checked)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">
                      Opção de quarto ano ativada
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Projeção de Valores */}
          {projectedValues.length > 0 && (
            <div className="bg-slate-700 p-4 rounded-xl">
              <h4 className="text-sm font-medium text-slate-100 mb-3">
                Projeção de Valores (Aumento anual: {league.annualIncreasePercentage}%)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {projectedValues.map((value, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-slate-400 mb-1">Ano {index + 1}</div>
                    <div className="text-sm font-medium text-slate-100">
                      {formatCurrency(value)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-600">
                <div className="text-xs text-slate-400">Valor total do contrato:</div>
                <div className="text-sm font-medium text-slate-100">
                  {formatCurrency(projectedValues.reduce((sum, value) => sum + value, 0))}
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              {isEditMode ? 'Atualizar Contrato' : 'Adicionar Contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
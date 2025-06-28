'use client';

import { useState, useEffect } from 'react';
import { League, LeagueStatus } from '@/types';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface LeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  league?: League | null;
}

/**
 * Modal para criação e edição de ligas
 *
 * Permite criar novas ligas ou editar ligas existentes com validação
 * de formulário e feedback visual.
 */
export default function LeagueModal({ isOpen, onClose, league }: LeagueModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    salaryCap: 279000000,
    totalTeams: 12,
    season: new Date().getFullYear(),
    status: LeagueStatus.ACTIVE,
    sleeperLeagueId: '',
    maxFranchiseTags: 1,
    minimumSalary: 1000000,
    annualIncreasePercentage: 15.0,
    seasonTurnoverDate: '04-01',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resetar formulário quando o modal abrir/fechar ou liga mudar
  useEffect(() => {
    if (isOpen) {
      if (league) {
        // Modo edição - preencher com dados da liga
        setFormData({
          name: league.name,
          salaryCap: league.salaryCap,
          totalTeams: league.totalTeams,
          season: league.season,
          status: league.status,
          sleeperLeagueId: league.sleeperLeagueId || '',
          maxFranchiseTags: league.maxFranchiseTags || 1,
          minimumSalary: league.minimumSalary || 1000000,
          annualIncreasePercentage: league.annualIncreasePercentage || 15.0,
          seasonTurnoverDate: league.seasonTurnoverDate || '04-01',
        });
      } else {
        // Modo criação - valores padrão
        setFormData({
          name: '',
          salaryCap: 279000000,
          totalTeams: 12,
          season: new Date().getFullYear(),
          status: LeagueStatus.ACTIVE,
          sleeperLeagueId: '',
          maxFranchiseTags: 1,
          minimumSalary: 1000000,
          annualIncreasePercentage: 15.0,
          seasonTurnoverDate: '04-01',
        });
      }
      setErrors({});
    }
  }, [isOpen, league]);

  // Validar formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validações apenas para modo de criação
    if (!league) {
      if (!formData.name.trim()) {
        newErrors.name = 'Nome da liga é obrigatório';
      } else if (formData.name.length < 3) {
        newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
      }

      if (formData.totalTeams < 4) {
        newErrors.totalTeams = 'Mínimo de 4 times';
      } else if (formData.totalTeams > 32) {
        newErrors.totalTeams = 'Máximo de 32 times';
      }

      if (formData.season < 2020) {
        newErrors.season = 'Temporada deve ser 2020 ou posterior';
      } else if (formData.season > new Date().getFullYear() + 5) {
        newErrors.season = 'Temporada muito distante no futuro';
      }
    }

    // Validações comuns para criação e edição
    if (formData.salaryCap < 50000000) {
      newErrors.salaryCap = 'Salary cap deve ser pelo menos $50M';
    } else if (formData.salaryCap > 1000000000) {
      newErrors.salaryCap = 'Salary cap não pode exceder $1B';
    }

    if (formData.maxFranchiseTags < 0) {
      newErrors.maxFranchiseTags = 'Número de franchise tags não pode ser negativo';
    } else if (formData.maxFranchiseTags > 5) {
      newErrors.maxFranchiseTags = 'Máximo de 5 franchise tags por temporada';
    }

    if (formData.minimumSalary < 500000) {
      newErrors.minimumSalary = 'Salário mínimo deve ser pelo menos $500K';
    } else if (formData.minimumSalary > 10000000) {
      newErrors.minimumSalary = 'Salário mínimo não pode exceder $10M';
    }

    if (formData.annualIncreasePercentage < 0) {
      newErrors.annualIncreasePercentage = 'Percentual não pode ser negativo';
    } else if (formData.annualIncreasePercentage > 50) {
      newErrors.annualIncreasePercentage = 'Percentual não pode exceder 50%';
    }

    // Validar formato da data (MM-DD)
    const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
    if (!dateRegex.test(formData.seasonTurnoverDate)) {
      newErrors.seasonTurnoverDate = 'Data deve estar no formato MM-DD (ex: 04-01)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (league) {
        // Modo edição - atualizar liga existente (apenas campos editáveis)
        const response = await fetch(`/api/leagues/${league.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            salaryCap: formData.salaryCap,
            sleeperLeagueId: formData.sleeperLeagueId,
            maxFranchiseTags: formData.maxFranchiseTags,
            minimumSalary: formData.minimumSalary,
            annualIncreasePercentage: formData.annualIncreasePercentage,
            seasonTurnoverDate: formData.seasonTurnoverDate,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar liga');
        }

        const data = await response.json();
        console.log('Liga atualizada:', data.league);
      } else {
        // Modo criação - criar nova liga
        const response = await fetch('/api/leagues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar liga');
        }

        const data = await response.json();
        console.log('Liga criada:', data.league);
      }

      onClose();
      // Recarregar a página para atualizar a lista de ligas
      window.location.reload();
    } catch (error) {
      console.error('Erro ao salvar liga:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Erro ao salvar liga. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Atualizar campo do formulário
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-slate-800 rounded-xl border border-slate-700 shadow-xl w-full max-w-md p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-100">
              {league ? 'Editar Liga' : 'Nova Liga'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome da liga - Apenas no modo de edição (bloqueado) */}
            {league && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome da Liga
                </label>
                <input
                  type="text"
                  value={formData.name}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-slate-300 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="mt-1 text-xs text-slate-400">
                  Nome da liga não pode ser alterado após criação
                </p>
              </div>
            )}

            {/* Salary Cap */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Salary Cap *</label>
              <input
                type="number"
                value={formData.salaryCap}
                onChange={e => updateField('salaryCap', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.salaryCap ? 'border-red-500' : 'border-slate-600'
                }`}
                min="50000000"
                max="1000000000"
                step="1000000"
                placeholder="279000000"
              />
              <p className="mt-1 text-xs text-slate-400">
                Formato: 279000000 (sem pontos ou vírgulas)
              </p>
              {errors.salaryCap && <p className="mt-1 text-sm text-red-400">{errors.salaryCap}</p>}
            </div>

            {/* Número de times - Apenas no modo de edição (bloqueado) */}
            {league && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Número de Times
                </label>
                <input
                  type="number"
                  value={formData.totalTeams}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-slate-300 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="mt-1 text-xs text-slate-400">
                  Número de times não pode ser alterado após criação
                </p>
              </div>
            )}

            {/* Temporada - Apenas no modo de edição (bloqueado) */}
            {league && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Temporada</label>
                <input
                  type="number"
                  value={formData.season}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-slate-300 cursor-not-allowed"
                  disabled
                  readOnly
                />
                <p className="mt-1 text-xs text-slate-400">
                  Temporada não pode ser alterada após criação
                </p>
              </div>
            )}

            {/* Status - Apenas no modo de edição (bloqueado) */}
            {league && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <select
                  value={formData.status}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-slate-300 cursor-not-allowed"
                  disabled
                >
                  <option value={LeagueStatus.ACTIVE}>Ativa</option>
                  <option value={LeagueStatus.OFFSEASON}>Off-season</option>
                  <option value={LeagueStatus.ARCHIVED}>Arquivada</option>
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  Status não pode ser alterado após criação
                </p>
              </div>
            )}

            {/* Sleeper League ID */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sleeper League ID
              </label>
              <input
                type="text"
                value={formData.sleeperLeagueId}
                onChange={e => updateField('sleeperLeagueId', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ID da liga no Sleeper (opcional)"
              />
              <p className="mt-1 text-xs text-slate-400">
                Atualize a cada ano quando renovar a liga no Sleeper
              </p>
            </div>

            {/* Máximo de Franchise Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Máximo de Franchise Tags *
              </label>
              <input
                type="number"
                value={formData.maxFranchiseTags}
                onChange={e => updateField('maxFranchiseTags', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.maxFranchiseTags ? 'border-red-500' : 'border-slate-600'
                }`}
                min="0"
                max="5"
              />
              <p className="mt-1 text-xs text-slate-400">
                Quantas franchise tags cada time pode usar por temporada
              </p>
              {errors.maxFranchiseTags && (
                <p className="mt-1 text-sm text-red-400">{errors.maxFranchiseTags}</p>
              )}
            </div>

            {/* Salário Mínimo */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Salário Mínimo *
              </label>
              <input
                type="number"
                value={formData.minimumSalary}
                onChange={e => updateField('minimumSalary', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.minimumSalary ? 'border-red-500' : 'border-slate-600'
                }`}
                min="500000"
                max="10000000"
                step="100000"
                placeholder="1000000"
              />
              <p className="mt-1 text-xs text-slate-400">
                Salário para jogadores não disputados (formato: 1000000)
              </p>
              {errors.minimumSalary && (
                <p className="mt-1 text-sm text-red-400">{errors.minimumSalary}</p>
              )}
            </div>

            {/* Percentual de Aumento Anual */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Aumento Anual dos Contratos (%) *
              </label>
              <input
                type="number"
                value={formData.annualIncreasePercentage}
                onChange={e =>
                  updateField('annualIncreasePercentage', parseFloat(e.target.value) || 0)
                }
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.annualIncreasePercentage ? 'border-red-500' : 'border-slate-600'
                }`}
                min="0"
                max="50"
                step="0.5"
                placeholder="15.0"
              />
              <p className="mt-1 text-xs text-slate-400">
                Percentual aplicado automaticamente a cada virada de temporada
              </p>
              {errors.annualIncreasePercentage && (
                <p className="mt-1 text-sm text-red-400">{errors.annualIncreasePercentage}</p>
              )}
            </div>

            {/* Data de Turnover */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Data de Virada da Temporada *
              </label>
              <input
                type="text"
                value={formData.seasonTurnoverDate}
                onChange={e => updateField('seasonTurnoverDate', e.target.value)}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.seasonTurnoverDate ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="04-01"
                maxLength={5}
              />
              <p className="mt-1 text-xs text-slate-400">
                Data quando os contratos recebem aumento anual (formato: MM-DD)
              </p>
              {errors.seasonTurnoverDate && (
                <p className="mt-1 text-sm text-red-400">{errors.seasonTurnoverDate}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : league ? 'Atualizar' : 'Criar Liga'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

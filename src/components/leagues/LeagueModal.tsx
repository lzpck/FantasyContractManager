'use client';

import { useState, useEffect } from 'react';
import { League, LeagueStatus, LeagueFormData, DeadMoneyConfig, DEFAULT_DEAD_MONEY_CONFIG } from '@/types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/ui/Toast';
import { DeadMoneyConfigForm } from './DeadMoneyConfigForm';
import { z } from 'zod';

export interface ImportProgress {
  step: 'validating' | 'fetching' | 'transforming' | 'saving' | 'complete';
  message: string;
  progress: number; // 0-100
}

export interface ImportResult {
  success: boolean;
  league?: League;
  message: string;
  details?: {
    teamsImported: number;
    playersImported: number;
  };
}

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
    sleeperLeagueId: '',
    salaryCap: 279000000, // Valor padrão em dólares
    maxFranchiseTags: 1,
    annualIncreasePercentage: 15,
    minimumSalary: 1000000, // Valor padrão em dólares
    seasonTurnoverDate: '04-01', // 1º de abril (MM-DD)
    deadMoneyConfig: DEFAULT_DEAD_MONEY_CONFIG,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const { addToast } = useToast();

  // Resetar formulário quando o modal abrir/fechar
  useEffect(() => {
    if (isOpen) {
      if (league) {
        // Modo edição - preencher com dados da liga existente
        let deadMoneyConfig = DEFAULT_DEAD_MONEY_CONFIG;
        if (league.deadMoneyConfig) {
          try {
            deadMoneyConfig = typeof league.deadMoneyConfig === 'string' 
              ? JSON.parse(league.deadMoneyConfig) 
              : league.deadMoneyConfig;
          } catch (error) {
            console.warn('Erro ao fazer parse da configuração de dead money, usando padrão:', error);
          }
        }
        
        setFormData({
          name: league.name || '',
          sleeperLeagueId: league.sleeperLeagueId || '',
          salaryCap: league.salaryCap || 279000000,
          maxFranchiseTags: league.maxFranchiseTags || 1,
          annualIncreasePercentage: league.annualIncreasePercentage || 15,
          minimumSalary: league.minimumSalary || 1000000,
          seasonTurnoverDate: league.seasonTurnoverDate || '04-01',
          deadMoneyConfig,
        });
      } else {
        // Modo criação/importação - valores padrão
        setFormData({
          name: '',
          sleeperLeagueId: '',
          salaryCap: 279000000, // $279 milhões
          maxFranchiseTags: 1,
          annualIncreasePercentage: 15,
          minimumSalary: 1000000, // $1 milhão
          seasonTurnoverDate: '04-01', // 1º de abril (MM-DD)
          deadMoneyConfig: DEFAULT_DEAD_MONEY_CONFIG,
        });
      }
      setErrors({});
      setImportProgress(null);
    }
  }, [isOpen, league]);

  // Esquema de validação condicional
  const validationSchema = league
    ? z.object({
        name: z.string().min(1, 'O nome da liga é obrigatório.'),
        salaryCap: z.coerce.number().min(1, 'O Salary Cap deve ser um número positivo.'),
        maxFranchiseTags: z.coerce
          .number()
          .min(0, 'O número máximo de Franchise Tags deve ser um número positivo.'),
        minimumSalary: z.coerce.number().min(0, 'O salário mínimo deve ser um número positivo.'),
        annualIncreasePercentage: z.coerce
          .number()
          .min(0, 'A porcentagem de aumento anual deve ser um número positivo.'),
        seasonTurnoverDate: z.string().min(1, 'A data de virada de temporada é obrigatória.'),
        sleeperLeagueId: z.string().optional(),
      })
    : z.object({
        name: z.string().optional(), // Nome é opcional na importação, será obtido da API do Sleeper
        salaryCap: z.coerce.number().min(1, 'O Salary Cap deve ser um número positivo.'),
        maxFranchiseTags: z.coerce
          .number()
          .min(0, 'O número máximo de Franchise Tags deve ser um número positivo.'),
        minimumSalary: z.coerce.number().min(0, 'O salário mínimo deve ser um número positivo.'),
        annualIncreasePercentage: z.coerce
          .number()
          .min(0, 'A porcentagem de aumento anual deve ser um número positivo.'),
        seasonTurnoverDate: z.string().min(1, 'A data de virada de temporada é obrigatória.'),
        sleeperLeagueId: z.string().min(1, 'O ID da liga Sleeper é obrigatório para importação.'),
      });

  // Validar formulário
  const validateForm = () => {
    try {
      validationSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  /**
   * Função para salvar liga (criar/importar ou editar)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (league) {
        // Modo edição - atualizar liga existente
        setImportProgress({ step: 'validating', message: 'Atualizando liga...', progress: 50 });

        const updateResponse = await fetch(`/api/leagues/${league.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            salaryCap: formData.salaryCap,
            sleeperLeagueId: formData.sleeperLeagueId,
            maxFranchiseTags: formData.maxFranchiseTags,
            annualIncreasePercentage: formData.annualIncreasePercentage,
            minimumSalary: formData.minimumSalary,
            seasonTurnoverDate: formData.seasonTurnoverDate,
            deadMoneyConfig: formData.deadMoneyConfig,
          }),
        });

        const updateData = await updateResponse.json();

        if (!updateResponse.ok) {
          const errorMsg = updateData.error || 'Erro ao atualizar liga';
          addToast({
            message: errorMsg,
            type: 'error',
          });
          return;
        }

        addToast({
          message: 'Liga atualizada com sucesso!',
          type: 'success',
        });

        onClose();

        // Refresh da página para efetivar as alterações
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // Modo criação/importação - importar nova liga do Sleeper
        const leagueId = formData.sleeperLeagueId.trim();
        setImportProgress({ step: 'validating', message: 'Iniciando importação...', progress: 0 });

        // Primeiro, validar o ID da liga
        const validateResponse = await fetch(
          `/api/leagues/import?leagueId=${encodeURIComponent(leagueId)}`,
        );
        const validateData = await validateResponse.json();

        if (!validateResponse.ok) {
          const errorMsg = validateData.error || 'Erro ao validar ID da liga';
          addToast({
            message: errorMsg,
            type: 'error',
          });
          return;
        }

        if (validateData.exists) {
          const warningMsg = 'Esta liga já foi importada anteriormente';
          addToast({
            message: warningMsg,
            type: 'warning',
          });
          return;
        }

        // Iniciar a importação
        setImportProgress({ step: 'fetching', message: 'Buscando dados da liga...', progress: 25 });

        const importResponse = await fetch('/api/leagues/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leagueId,
            salaryCap: formData.salaryCap,
            maxFranchiseTags: formData.maxFranchiseTags,
            annualIncreasePercentage: formData.annualIncreasePercentage,
            minimumSalary: formData.minimumSalary,
            seasonTurnoverDate: formData.seasonTurnoverDate,
            deadMoneyConfig: formData.deadMoneyConfig,
          }),
        });

        const importData: ImportResult = await importResponse.json();

        if (!importResponse.ok) {
          const errorMsg = importData.message || 'Erro ao importar liga';
          addToast({
            message: errorMsg,
            type: 'error',
          });
          return;
        }

        if (importData.success && importData.league) {
          const successMsg = `Liga "${importData.league.name}" importada com sucesso!`;
          addToast({
            message: successMsg,
            type: 'success',
          });

          onClose();
          // Recarregar a página para atualizar a lista de ligas
          window.location.reload();
        } else {
          const errorMsg = importData.message;
          addToast({
            message: errorMsg,
            type: 'error',
          });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar liga:', error);
      const errorMsg = league
        ? 'Erro inesperado ao atualizar liga'
        : 'Erro inesperado ao importar liga';
      addToast({
        message: errorMsg,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
      setImportProgress(null);
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
        <div className="relative bg-slate-800 rounded-xl border border-slate-700 shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-100">
              {league ? 'Editar Liga' : 'Importar Liga do Sleeper'}
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
            {/* Nome da Liga - Somente leitura */}
            {league && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome da Liga
                </label>
                <div className="w-full px-3 py-2 bg-slate-600 border border-slate-600 rounded-lg text-slate-300">
                  {formData.name || 'Nome não disponível'}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  O nome da liga é importado do Sleeper e não pode ser alterado
                </p>
              </div>
            )}

            {/* Sleeper League ID */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                ID da Liga (Sleeper) {!league && '*'}
              </label>
              <input
                type="text"
                value={formData.sleeperLeagueId}
                onChange={e => updateField('sleeperLeagueId', e.target.value)}
                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sleeperLeagueId ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="Ex: 123456789"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-slate-400">
                {league
                  ? 'ID da liga no Sleeper (pode ser atualizado para nova temporada)'
                  : 'Importe uma liga existente do Sleeper usando o ID da liga'}
              </p>
              {errors.sleeperLeagueId && (
                <p className="mt-1 text-sm text-red-400">{errors.sleeperLeagueId}</p>
              )}
            </div>

            {/* Configurações da Liga */}
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Configurações da Liga</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Salary Cap */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Salary Cap *
                  </label>
                  <input
                    type="number"
                    value={formData.salaryCap}
                    onChange={e => updateField('salaryCap', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.salaryCap ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="279000000"
                    disabled={isSubmitting}
                    min="1"
                  />
                  <p className="mt-1 text-xs text-slate-400">Teto salarial da liga em dólares</p>
                  {errors.salaryCap && (
                    <p className="mt-1 text-sm text-red-400">{errors.salaryCap}</p>
                  )}
                </div>

                {/* Max Franchise Tags */}
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
                    placeholder="1"
                    disabled={isSubmitting}
                    min="0"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Número máximo de franchise tags por temporada
                  </p>
                  {errors.maxFranchiseTags && (
                    <p className="mt-1 text-sm text-red-400">{errors.maxFranchiseTags}</p>
                  )}
                </div>

                {/* Annual Increase Percentage */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Aumento Anual (%) *
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
                    placeholder="15"
                    disabled={isSubmitting}
                    min="0"
                    step="0.1"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Percentual de aumento automático dos contratos
                  </p>
                  {errors.annualIncreasePercentage && (
                    <p className="mt-1 text-sm text-red-400">{errors.annualIncreasePercentage}</p>
                  )}
                </div>

                {/* Minimum Salary */}
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
                    placeholder="1000000"
                    disabled={isSubmitting}
                    min="1"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Salário mínimo para contratos em dólares
                  </p>
                  {errors.minimumSalary && (
                    <p className="mt-1 text-sm text-red-400">{errors.minimumSalary}</p>
                  )}
                </div>
              </div>

              {/* Season Turnover Date - Campo único em linha separada */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Data de Virada de Temporada *
                </label>
                <input
                  type="text"
                  value={formData.seasonTurnoverDate}
                  onChange={e => updateField('seasonTurnoverDate', e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.seasonTurnoverDate ? 'border-red-500' : 'border-slate-600'
                  }`}
                  placeholder="04-01"
                  disabled={isSubmitting}
                  pattern="^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Data da virada de temporada no formato MM-DD (ex: 04-01 para 1º de abril)
                </p>
                {errors.seasonTurnoverDate && (
                  <p className="mt-1 text-sm text-red-400">{errors.seasonTurnoverDate}</p>
                )}
              </div>

              {/* Dead Money Configuration */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Configuração de Dead Money</h3>
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <DeadMoneyConfigForm
                    config={formData.deadMoneyConfig || DEFAULT_DEAD_MONEY_CONFIG}
                    onChange={(config) => updateField('deadMoneyConfig', config)}
                    disabled={isSubmitting}
                    compact={true}
                  />
                </div>
              </div>
            </div>

            {/* Barra de progresso da importação */}
            {importProgress && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>{importProgress.message}</span>
                  <span>{importProgress.progress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

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
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {league ? 'Salvando...' : 'Importando...'}
                  </>
                ) : league ? (
                  'Salvar Alterações'
                ) : (
                  'Importar Liga'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

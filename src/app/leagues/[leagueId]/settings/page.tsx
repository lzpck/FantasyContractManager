'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  TagIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import { useLeagues } from '@/hooks/useLeagues';
import { useDeadMoneyConfig } from '@/hooks/useDeadMoneyConfig';
import { DeadMoneyConfigForm } from '@/components/leagues/DeadMoneyConfigForm';
import { SeasonTurnoverManager } from '@/components/leagues/SeasonTurnoverManager';
import { useToast } from '@/components/ui/Toast';
import { DeadMoneyConfig } from '@/types';
import { z } from 'zod';

/**
 * Página de configurações avançadas da liga
 */
export default function LeagueSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const leagueId = params.leagueId as string;

  const { leagues, loading: leaguesLoading } = useLeagues();
  const { config, canEdit, loading, error, updateConfig } = useDeadMoneyConfig(leagueId);

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'dead-money' | 'general' | 'season-turnover'>(
    'dead-money',
  );

  const [formData, setFormData] = useState({
    sleeperLeagueId: '',
    salaryCap: 0,
    maxFranchiseTags: 0,
    annualIncreasePercentage: 0,
    minimumSalary: 0,
    seasonTurnoverDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Encontrar a liga atual
  const league = leagues.find(l => l.id === leagueId);

  const validationSchema = useMemo(
    () =>
      z.object({
        salaryCap: z.coerce.number().min(1, 'O Salary Cap deve ser positivo.'),
        maxFranchiseTags: z.coerce
          .number()
          .min(0, 'Máximo de Franchise Tags deve ser não negativo.'),
        minimumSalary: z.coerce.number().min(0, 'Salário mínimo deve ser não negativo.'),
        annualIncreasePercentage: z.coerce.number().min(0, 'Aumento anual deve ser não negativo.'),
        seasonTurnoverDate: z
          .string()
          .regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, 'Data no formato MM-DD (ex: 04-01)'),
        sleeperLeagueId: z.string().optional(),
      }),
    [],
  );

  const initialValues = useMemo(() => {
    if (!league) return formData;
    return {
      sleeperLeagueId: league.sleeperLeagueId || '',
      salaryCap: league.salaryCap || 0,
      maxFranchiseTags: league.maxFranchiseTags || 0,
      annualIncreasePercentage: league.annualIncreasePercentage || 0,
      minimumSalary: league.minimumSalary || 0,
      seasonTurnoverDate: league.seasonTurnoverDate || '',
    };
  }, [league]);

  useEffect(() => {
    setFormData(initialValues);
    setErrors({});
  }, [initialValues]);

  const isDirty = useMemo(() => {
    return (
      formData.sleeperLeagueId !== initialValues.sleeperLeagueId ||
      formData.salaryCap !== initialValues.salaryCap ||
      formData.maxFranchiseTags !== initialValues.maxFranchiseTags ||
      formData.annualIncreasePercentage !== initialValues.annualIncreasePercentage ||
      formData.minimumSalary !== initialValues.minimumSalary ||
      formData.seasonTurnoverDate !== initialValues.seasonTurnoverDate
    );
  }, [formData, initialValues]);

  const validateField = (key: keyof typeof formData, value: any) => {
    const candidate = { ...formData, [key]: value };
    try {
      validationSchema.parse(candidate);
      setErrors(prev => ({ ...prev, [key]: '' }));
      return true;
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        const fieldErr = e.errors.find(err => String(err.path[0]) === key);
        setErrors(prev => ({ ...prev, [key]: fieldErr?.message || '' }));
      }
      return false;
    }
  };

  const updateField = (key: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    validateField(key, value);
  };

  // Lidar com atualização da configuração de dead money
  const handleDeadMoneyConfigChange = async (newConfig: DeadMoneyConfig) => {
    if (!canEdit) {
      addToast({
        message: 'Apenas o comissário pode alterar as configurações da liga',
        type: 'error',
      });
      return;
    }

    setIsSaving(true);
    try {
      const success = await updateConfig(newConfig);
      if (success) {
        addToast({
          message: 'Configuração de dead money atualizada com sucesso!',
          type: 'success',
        });
      } else {
        addToast({
          message: 'Erro ao atualizar configuração de dead money',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      addToast({
        message: 'Erro inesperado ao salvar configuração',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (leaguesLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  // Liga não encontrada
  if (!league) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Liga não encontrada</h1>
          <p className="text-slate-400 mb-4">
            A liga solicitada não foi encontrada ou você não tem acesso a ela.
          </p>
          <button
            onClick={() => router.push('/leagues')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Voltar às Ligas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/leagues/${leagueId}`)}
                className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-100">Configurações da Liga</h1>
                <p className="text-sm text-slate-400">{league.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Cog6ToothIcon className="h-5 w-5 text-slate-400" />
              {!canEdit && (
                <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded">
                  Somente Leitura
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!canEdit && (
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="text-yellow-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-200">Somente leitura</h3>
                <p className="text-sm text-yellow-100">Você não pode editar essas configurações.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dead-money')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dead-money'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
              }`}
            >
              Dead Money
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
              }`}
            >
              Configurações Gerais
            </button>
            <button
              onClick={() => setActiveTab('season-turnover')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'season-turnover'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
              }`}
            >
              Virada de Temporada
            </button>
          </nav>
        </div>

        {/* Conteúdo das tabs */}
        {activeTab === 'dead-money' && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            {error && (
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="text-red-400">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-red-200">
                      Erro ao carregar configuração
                    </h3>
                    <p className="text-sm text-red-100">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {config && (
              <DeadMoneyConfigForm
                config={config}
                onChange={handleDeadMoneyConfigChange}
                disabled={!canEdit || isSaving}
              />
            )}

            {isSaving && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                <span className="text-slate-400">Salvando configuração...</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'general' && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Cog6ToothIcon className="h-5 w-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-100">Configurações Gerais</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome da Liga
                </label>
                <div className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300">
                  {league.name}
                </div>
                <p className="mt-1 text-xs text-slate-400">Nome importado do Sleeper</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <IdentificationIcon className="h-4 w-4 text-slate-400" />
                  ID da Liga (Sleeper)
                </label>
                <input
                  type="text"
                  value={formData.sleeperLeagueId || ''}
                  onChange={e => updateField('sleeperLeagueId', e.target.value)}
                  disabled={!canEdit || isSaving}
                  className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.sleeperLeagueId ? 'border-red-500' : 'border-slate-600'
                  }`}
                  placeholder="Ex: 123456789012345678"
                />
                {errors.sleeperLeagueId && (
                  <p className="mt-1 text-sm text-red-400">{errors.sleeperLeagueId}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CurrencyDollarIcon className="h-5 w-5 text-slate-400" />
                <h4 className="text-sm font-medium text-slate-200">Financeiro</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Salary Cap
                  </label>
                  <input
                    type="number"
                    value={formData.salaryCap}
                    onChange={e => updateField('salaryCap', parseInt(e.target.value) || 0)}
                    disabled={!canEdit || isSaving}
                    className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.salaryCap ? 'border-red-500' : 'border-slate-600'
                    }`}
                    min={1}
                  />
                  {errors.salaryCap && (
                    <p className="mt-1 text-sm text-red-400">{errors.salaryCap}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Salário Mínimo
                  </label>
                  <input
                    type="number"
                    value={formData.minimumSalary}
                    onChange={e => updateField('minimumSalary', parseInt(e.target.value) || 0)}
                    disabled={!canEdit || isSaving}
                    className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.minimumSalary ? 'border-red-500' : 'border-slate-600'
                    }`}
                    min={0}
                  />
                  {errors.minimumSalary && (
                    <p className="mt-1 text-sm text-red-400">{errors.minimumSalary}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Aumento Anual (%)
                  </label>
                  <input
                    type="number"
                    value={formData.annualIncreasePercentage}
                    onChange={e =>
                      updateField('annualIncreasePercentage', parseFloat(e.target.value) || 0)
                    }
                    disabled={!canEdit || isSaving}
                    className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.annualIncreasePercentage ? 'border-red-500' : 'border-slate-600'
                    }`}
                    min={0}
                    step={0.1}
                  />
                  {errors.annualIncreasePercentage && (
                    <p className="mt-1 text-sm text-red-400">{errors.annualIncreasePercentage}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TagIcon className="h-5 w-5 text-slate-400" />
                <h4 className="text-sm font-medium text-slate-200">Regras</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Máximo de Franchise Tags
                  </label>
                  <input
                    type="number"
                    value={formData.maxFranchiseTags}
                    onChange={e => updateField('maxFranchiseTags', parseInt(e.target.value) || 0)}
                    disabled={!canEdit || isSaving}
                    className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.maxFranchiseTags ? 'border-red-500' : 'border-slate-600'
                    }`}
                    min={0}
                  />
                  {errors.maxFranchiseTags && (
                    <p className="mt-1 text-sm text-red-400">{errors.maxFranchiseTags}</p>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                    Data de Virada de Temporada
                  </label>
                  <input
                    type="text"
                    value={formData.seasonTurnoverDate}
                    onChange={e => updateField('seasonTurnoverDate', e.target.value)}
                    disabled={!canEdit || isSaving}
                    className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.seasonTurnoverDate ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="MM-DD"
                  />
                  {errors.seasonTurnoverDate && (
                    <p className="mt-1 text-sm text-red-400">{errors.seasonTurnoverDate}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setFormData(initialValues)}
                disabled={!canEdit || isSaving || !isDirty}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reverter
              </button>
              <button
                onClick={async () => {
                  try {
                    validationSchema.parse(formData);
                  } catch (e) {
                    addToast({ message: 'Verifique os campos inválidos', type: 'error' });
                    return;
                  }
                  if (!canEdit) {
                    addToast({
                      message: 'Apenas o comissário pode salvar alterações',
                      type: 'error',
                    });
                    return;
                  }
                  setIsSaving(true);
                  try {
                    const res = await fetch(`/api/leagues/${leagueId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sleeperLeagueId: formData.sleeperLeagueId,
                        salaryCap: formData.salaryCap,
                        maxFranchiseTags: formData.maxFranchiseTags,
                        minimumSalary: formData.minimumSalary,
                        annualIncreasePercentage: formData.annualIncreasePercentage,
                        seasonTurnoverDate: formData.seasonTurnoverDate,
                      }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok) {
                      addToast({
                        message: 'Configurações atualizadas com sucesso!',
                        type: 'success',
                      });
                    } else {
                      addToast({
                        message: data.error || 'Erro ao atualizar configurações',
                        type: 'error',
                      });
                    }
                  } catch (err) {
                    addToast({ message: 'Erro inesperado ao salvar', type: 'error' });
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={!canEdit || isSaving || !isDirty || Object.values(errors).some(v => v)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M17 3a2 2 0 012 2v10a2 2 0 01-2 2H7l-4 2V5a2 2 0 012-2h12z" />
                </svg>
                Salvar
              </button>
            </div>
          </div>
        )}

        {activeTab === 'season-turnover' && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-6">Virada de Temporada</h3>
            <SeasonTurnoverManager
              league={league}
              canEdit={canEdit}
              onSuccess={() => {
                addToast({
                  message: 'Dados atualizados após virada de temporada',
                  type: 'success',
                });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

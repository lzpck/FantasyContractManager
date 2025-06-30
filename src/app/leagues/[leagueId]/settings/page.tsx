'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useLeagues } from '@/hooks/useLeagues';
import { useDeadMoneyConfig } from '@/hooks/useDeadMoneyConfig';
import { DeadMoneyConfigForm } from '@/components/leagues/DeadMoneyConfigForm';
import { useToast } from '@/components/ui/Toast';
import { DeadMoneyConfig } from '@/types';

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
  const [activeTab, setActiveTab] = useState<'dead-money' | 'general'>('dead-money');

  // Encontrar a liga atual
  const league = leagues.find(l => l.id === leagueId);

  // Lidar com atualização da configuração de dead money
  const handleDeadMoneyConfigChange = async (newConfig: DeadMoneyConfig) => {
    if (!canEdit) {
      addToast('Apenas o comissário pode alterar as configurações da liga', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const success = await updateConfig(newConfig);
      if (success) {
        addToast('Configuração de dead money atualizada com sucesso!', 'success');
      } else {
        addToast('Erro ao atualizar configuração de dead money', 'error');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      addToast('Erro inesperado ao salvar configuração', 'error');
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
        {/* Aviso de permissão */}
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
                <h3 className="text-sm font-medium text-yellow-200">Acesso Limitado</h3>
                <p className="text-sm text-yellow-100">
                  Apenas o comissário da liga pode alterar essas configurações.
                </p>
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
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Configurações Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome da Liga
                </label>
                <div className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300">
                  {league.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Salary Cap</label>
                <div className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300">
                  ${league.salaryCap.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Máximo de Franchise Tags
                </label>
                <div className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300">
                  {league.maxFranchiseTags}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Aumento Anual (%)
                </label>
                <div className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300">
                  {league.annualIncreasePercentage}%
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Salário Mínimo
                </label>
                <div className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300">
                  ${league.minimumSalary.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Data de Virada de Temporada
                </label>
                <div className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300">
                  {league.seasonTurnoverDate}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <h4 className="text-sm font-medium text-blue-200 mb-2">📝 Nota</h4>
              <p className="text-sm text-blue-100">
                Para alterar as configurações gerais da liga, use o modal de edição na página
                principal das ligas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

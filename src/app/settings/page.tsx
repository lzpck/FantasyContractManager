'use client';

import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { League, TeamRoster } from '@/types';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface ImportProgress {
  step: 'validating' | 'fetching' | 'transforming' | 'saving' | 'complete';
  message: string;
  progress: number; // 0-100
}

export interface ImportResult {
  success: boolean;
  league?: League;
  rosters?: TeamRoster[];
  message: string;
  details?: {
    teamsImported: number;
    playersImported: number;
  };
}

/**
 * Página de configurações do sistema
 *
 * Permite que comissários:
 * - Importem ligas via ID do Sleeper
 * - Editem o percentual de aumento anual dos contratos
 *
 * Usuários não-comissários podem apenas visualizar as configurações atuais.
 */
export default function SettingsPage() {
  const { state, addLeague, setCurrentLeague } = useAppContext();
  const { currentLeague } = state;
  const { isCommissioner } = useAuth();

  // Estados para os formulários
  const [leagueId, setLeagueId] = useState('');
  const [annualIncrease, setAnnualIncrease] = useState(
    currentLeague?.settings.annualIncreasePercentage || 15,
  );
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const { addToast, ToastContainer } = useToast();

  /**
   * Função para importar liga do Sleeper
   */
  const handleImportLeague = async () => {
    if (!leagueId.trim()) {
      addToast({
        message: 'Por favor, insira um ID de liga válido',
        type: 'error',
      });
      setImportMessage('Por favor, insira um ID de liga válido');
      return;
    }

    setIsImporting(true);
    setImportProgress({ step: 'validating', message: 'Iniciando importação...', progress: 0 });
    setImportMessage('');

    try {
      // Primeiro, validar o ID da liga
      const validateResponse = await fetch(
        `/api/leagues/import?leagueId=${encodeURIComponent(leagueId.trim())}`,
      );
      const validateData = await validateResponse.json();

      if (!validateResponse.ok) {
        const errorMsg = validateData.error || 'Erro ao validar ID da liga';
        addToast({
          message: errorMsg,
          type: 'error',
        });
        setImportMessage(errorMsg);
        return;
      }

      if (validateData.exists) {
        const warningMsg = 'Esta liga já foi importada anteriormente';
        addToast({
          message: warningMsg,
          type: 'warning',
        });
        setImportMessage(warningMsg);
        return;
      }

      // Iniciar a importação
      setImportProgress({ step: 'fetching', message: 'Buscando dados da liga...', progress: 25 });

      const importResponse = await fetch('/api/leagues/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leagueId: leagueId.trim() }),
      });

      const importData: ImportResult = await importResponse.json();

      if (!importResponse.ok) {
        const errorMsg = importData.message || 'Erro ao importar liga';
        addToast({
          message: errorMsg,
          type: 'error',
        });
        setImportMessage(errorMsg);
        return;
      }

      if (importData.success && importData.league) {
        // Atualizar o contexto da aplicação
        addLeague(importData.league);
        setCurrentLeague(importData.league);
        const successMsg = `Liga "${importData.league.name}" importada com sucesso!`;
        addToast({
          message: successMsg,
          type: 'success',
        });
        setImportMessage(successMsg);
        setLeagueId('');
      } else {
        const errorMsg = importData.message;
        addToast({
          message: errorMsg,
          type: 'error',
        });
        setImportMessage(errorMsg);
      }
    } catch (error) {
      console.error('Erro ao importar liga:', error);
      const errorMsg = 'Erro inesperado ao importar liga';
      addToast({
        message: errorMsg,
        type: 'error',
      });
      setImportMessage(errorMsg);
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  /**
   * Função para salvar alterações no percentual de aumento anual
   */
  const handleSaveAnnualIncrease = async () => {
    if (annualIncrease < 0 || annualIncrease > 100) {
      setSaveMessage('O percentual deve estar entre 0% e 100%.');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      // TODO: Implementar salvamento real no backend/localStorage
      // Por enquanto, simular o processo
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simular sucesso
      setSaveMessage('Configuração salva com sucesso!');
    } catch {
      // Removendo variável 'error' não utilizada
      setSaveMessage('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Configurações</h1>
          <p className="mt-2 text-slate-400">
            Gerencie as configurações da liga e integrações do sistema.
          </p>
        </div>

        {/* Verificação de permissão */}
        {!isCommissioner && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>Acesso Restrito:</strong> Apenas o comissário pode alterar configurações
                  ou importar ligas.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Seção: Importação de Liga */}
          <div className="bg-slate-800 shadow-xl rounded-xl">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-slate-100 flex items-center">
                <span className="mr-2">🔗</span>
                Importação de Liga
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Importe uma liga existente do Sleeper usando o ID da liga.
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="leagueId" className="block text-sm font-medium text-slate-100">
                    ID da Liga (Sleeper)
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="leagueId"
                      value={leagueId}
                      onChange={e => setLeagueId(e.target.value)}
                      disabled={!isCommissioner}
                      placeholder="Ex: 123456789"
                      className="block w-full px-3 py-2 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed bg-slate-800 text-slate-100 placeholder-slate-500"
                    />
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

                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleImportLeague}
                    disabled={!isCommissioner || isImporting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
                  >
                    {isImporting ? (
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
                        Importando...
                      </>
                    ) : (
                      'Importar Liga'
                    )}
                  </button>
                </div>

                {importMessage && (
                  <div
                    className={`p-3 rounded-md ${
                      importMessage.includes('sucesso')
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {importMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seção: Configuração de Aumento Anual */}
          <div className="bg-slate-800 shadow-xl rounded-xl">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-slate-100 flex items-center">
                <span className="mr-2">📈</span>
                Aumento Anual dos Contratos
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Configure o percentual de aumento automático aplicado aos contratos a cada virada de
                temporada.
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="annualIncrease"
                    className="block text-sm font-medium text-slate-100"
                  >
                    Percentual de Aumento Anual (%)
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="number"
                      id="annualIncrease"
                      value={annualIncrease}
                      onChange={e => setAnnualIncrease(Number(e.target.value))}
                      disabled={!isCommissioner}
                      min="0"
                      max="100"
                      step="0.1"
                      className="block w-32 px-3 py-2 border border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed bg-slate-800 text-slate-100"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Valor padrão: 15%. Este aumento é aplicado automaticamente em 1º de abril.
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSaveAnnualIncrease}
                    disabled={!isCommissioner || isSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
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
                        Salvando...
                      </>
                    ) : (
                      'Salvar Alteração'
                    )}
                  </button>
                </div>

                {saveMessage && (
                  <div
                    className={`p-3 rounded-md ${
                      saveMessage.includes('sucesso')
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {saveMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seção: Informações Gerais */}
          <div className="bg-slate-800 shadow-xl rounded-xl">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-slate-100 flex items-center">
                <span className="mr-2">ℹ️</span>
                Configurações Atuais
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Visualize as configurações atuais da liga.
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-100 mb-2">Liga Atual</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Nome:</span>
                      <span className="text-sm font-medium text-slate-100">
                        {currentLeague?.name || 'Nenhuma liga selecionada'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">ID Sleeper:</span>
                      <span className="text-sm font-medium text-slate-100">
                        {currentLeague?.sleeperLeagueId || 'Não configurado'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Temporada:</span>
                      <span className="text-sm font-medium text-slate-100">
                        {currentLeague?.season || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-100 mb-2">
                    Configurações Financeiras
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Salary Cap:</span>
                      <span className="text-sm font-medium text-slate-100">
                        ${currentLeague?.salaryCap?.toLocaleString() || 'N/A'} milhões
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Aumento Anual:</span>
                      <span className="text-sm font-medium text-slate-100">
                        {currentLeague?.settings.annualIncreasePercentage || 15}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Salário Mínimo:</span>
                      <span className="text-sm font-medium text-slate-100">
                        ${currentLeague?.settings.minimumSalary?.toLocaleString() || 'N/A'} milhões
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Container de Toasts */}
      <ToastContainer />
    </div>
  );
}

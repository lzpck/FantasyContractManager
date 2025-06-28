'use client';

import { useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { DateDisplay } from '@/components/ui/DateDisplay';

interface SyncButtonProps {
  /** Função chamada ao iniciar sincronização */
  onSync: () => Promise<void> | void;
  /** Se true, desabilita o botão */
  disabled?: boolean;
}

/**
 * Componente de botão para sincronização com Sleeper
 *
 * Permite sincronizar dados da liga com a plataforma Sleeper,
 * exibindo estados de loading, sucesso e erro.
 */
export function SyncButton({ onSync, disabled = false }: SyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'error' | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Função para executar sincronização
  const handleSync = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    setLastSyncStatus(null);

    try {
      await onSync();
      setLastSyncStatus('success');
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setLastSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para formatar tempo da última sincronização
  const formatLastSyncTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Agora mesmo';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`;
    } else {
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `${diffInHours}h atrás`;
      } else {
        // Usa o componente DateDisplay para formatar a data
        return <DateDisplay date={date} includeTime={true} size="sm" />;
      }
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-slate-100 mb-1">Sincronização com Sleeper</h3>
          <p className="text-sm text-slate-400">
            Sincronize dados da liga, times e jogadores com a plataforma Sleeper
          </p>

          {/* Status da última sincronização */}
          {lastSyncTime && (
            <div className="mt-2 flex items-center text-sm">
              {lastSyncStatus === 'success' && (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-400">
                    Última sincronização: {formatLastSyncTime(lastSyncTime)}
                  </span>
                </>
              )}
              {lastSyncStatus === 'error' && (
                <>
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-400">
                    Erro na sincronização: {formatLastSyncTime(lastSyncTime)}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Botão de sincronização */}
        <div className="ml-4">
          <button
            onClick={handleSync}
            disabled={isLoading || disabled}
            className={`
              inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl
              transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md
              ${
                isLoading || disabled
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Sincronizar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Informações adicionais sobre sincronização */}
      <div className="mt-4 pt-4 border-t border-slate-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-400">
          <div>
            <span className="font-medium">Dados sincronizados:</span>
            <ul className="mt-1 space-y-1">
              <li>• Informações da liga</li>
              <li>• Times e managers</li>
              <li>• Rosters atuais</li>
            </ul>
          </div>
          <div>
            <span className="font-medium">Frequência recomendada:</span>
            <ul className="mt-1 space-y-1">
              <li>• Início da temporada</li>
              <li>• Após trades</li>
              <li>• Semanalmente</li>
            </ul>
          </div>
          <div>
            <span className="font-medium">Observações:</span>
            <ul className="mt-1 space-y-1">
              <li>• Contratos não são alterados</li>
              <li>• Apenas dados básicos</li>
              <li>• Processo seguro</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Nota informativa sobre a sincronização */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-xl">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-blue-300 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-blue-200">
            <strong>Nota:</strong> A sincronização atualiza apenas informações básicas da liga e
            times. Contratos, salários e configurações financeiras não são afetados.
          </span>
        </div>
      </div>
    </div>
  );
}

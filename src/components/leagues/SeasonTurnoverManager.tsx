'use client';

import React, { useState, useEffect } from 'react';
import { CalendarIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { League } from '@/types';
import { SeasonTurnoverModal } from './SeasonTurnoverModal';
import { useToast } from '@/components/ui/Toast';

interface ContractChange {
  id: string;
  playerName: string;
  teamName: string;
  currentYearsRemaining: number;
  newYearsRemaining: number;
  currentSalary: number;
  newSalary: number;
  newStatus: 'Elegível para Extensão' | 'Elegível para Tag' | 'Contrato Ativo';
  hasBeenExtended: boolean;
  hasBeenTagged: boolean;
}

interface SeasonTurnoverSummary {
  totalContracts: number;
  contractsAffected: number;
  eligibleForExtension: number;
  eligibleForFranchiseTag: number;
}

interface SeasonTurnoverManagerProps {
  league: League;
  canEdit: boolean;
  onSuccess?: () => void;
}

/**
 * Componente para gerenciar a virada de temporada
 * Permite ao comissário visualizar e executar a rotina de virada de temporada
 */
export function SeasonTurnoverManager({ league, canEdit, onSuccess }: SeasonTurnoverManagerProps) {
  const [contractChanges, setContractChanges] = useState<ContractChange[]>([]);
  const [summary, setSummary] = useState<SeasonTurnoverSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canExecuteTurnover, setCanExecuteTurnover] = useState(false);
  const { addToast } = useToast();

  // Verificar se a virada de temporada pode ser executada
  useEffect(() => {
    const checkTurnoverEligibility = () => {
      if (!league.seasonTurnoverDate) {
        setCanExecuteTurnover(false);
        return;
      }

      const now = new Date();
      const currentYear = now.getFullYear();

      // Converter a data de virada (formato MM-DD) para uma data completa
      const [month, day] = league.seasonTurnoverDate.split('-').map(Number);
      const turnoverDate = new Date(currentYear, month - 1, day);

      // Se a data já passou este ano, considerar o próximo ano
      if (turnoverDate < now) {
        turnoverDate.setFullYear(currentYear + 1);
      }

      // Permitir execução se estamos na data ou depois dela
      // Para fins de demonstração, vamos permitir sempre que seja comissário
      setCanExecuteTurnover(canEdit);
    };

    checkTurnoverEligibility();
  }, [league.seasonTurnoverDate, canEdit]);

  // Buscar contratos que serão afetados pela virada de temporada
  const fetchContractChanges = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leagues/${league.id}/season-turnover/preview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar contratos');
      }

      const data = await response.json();
      setContractChanges(data.contractChanges || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      addToast({
        message: 'Erro ao carregar contratos para pré-visualização',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Executar a virada de temporada
  const executeSeasonTurnover = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/leagues/${league.id}/season-turnover/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao executar virada de temporada');
      }

      const data = await response.json();

      addToast({
        message: `Virada de temporada executada com sucesso! ${data.contractsUpdated} contratos atualizados.`,
        type: 'success',
      });

      setIsModalOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao executar virada de temporada:', error);
      addToast({
        message:
          error instanceof Error
            ? error.message
            : 'Erro inesperado ao executar virada de temporada',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreviewTurnover = async () => {
    await fetchContractChanges();
    setIsModalOpen(true);
  };

  const formatTurnoverDate = (dateString: string) => {
    const [month, day] = dateString.split('-').map(Number);
    const date = new Date(2024, month - 1, day);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  };

  return (
    <div className="space-y-6">
      {/* Informações da virada de temporada */}
      <div className="bg-slate-700 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <CalendarIcon className="h-8 w-8 text-blue-400 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Virada de Temporada</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Data configurada:</span>
                <span className="ml-2 text-slate-100 font-medium">
                  {formatTurnoverDate(league.seasonTurnoverDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Aumento anual:</span>
                <span className="ml-2 text-slate-100 font-medium">
                  {league.annualIncreasePercentage}%
                </span>
              </div>
            </div>
            <p className="text-slate-400 mt-3 text-sm">
              A virada de temporada reduz em 1 ano todos os contratos ativos e aplica o aumento
              salarial configurado. Jogadores no último ano ficam elegíveis para extensão ou tag.
            </p>
          </div>
        </div>
      </div>

      {/* Status e ações */}
      <div className="bg-slate-700 rounded-lg p-6">
        <h4 className="text-md font-semibold text-slate-100 mb-4">Ações Disponíveis</h4>

        {!canEdit && (
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div>
                <h5 className="text-sm font-medium text-yellow-200">Acesso Restrito</h5>
                <p className="text-sm text-yellow-100">
                  Apenas o comissário da liga pode executar a virada de temporada.
                </p>
              </div>
            </div>
          </div>
        )}

        {canEdit && !canExecuteTurnover && (
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-blue-400" />
              <div>
                <h5 className="text-sm font-medium text-blue-200">Aguardando Data</h5>
                <p className="text-sm text-blue-100">
                  A virada de temporada estará disponível a partir de{' '}
                  {formatTurnoverDate(league.seasonTurnoverDate)}.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handlePreviewTurnover}
            disabled={!canEdit || isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{isLoading ? 'Carregando...' : 'Pré-visualizar Alterações'}</span>
          </button>

          {canExecuteTurnover && (
            <button
              onClick={handlePreviewTurnover}
              disabled={!canEdit || isLoading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isLoading ? 'Carregando...' : 'Executar Virada de Temporada'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="bg-slate-700 rounded-lg p-6">
        <h4 className="text-md font-semibold text-slate-100 mb-3">Como Funciona</h4>
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong className="text-slate-100">Redução de Anos:</strong> Todos os contratos ativos
              têm seus anos restantes reduzidos em 1.
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong className="text-slate-100">Aumento Salarial:</strong> Todos os salários são
              aumentados em {league.annualIncreasePercentage}%.
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong className="text-slate-100">Elegibilidade:</strong> Jogadores que ficam com 0
              anos restantes tornam-se elegíveis para extensão ou franchise tag.
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong className="text-slate-100">Irreversível:</strong> Esta ação não pode ser
              desfeita. Sempre verifique a pré-visualização antes de confirmar.
            </div>
          </div>
        </div>
      </div>

      {/* Modal de pré-visualização */}
      <SeasonTurnoverModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contractChanges={contractChanges}
        summary={summary}
        annualIncreasePercentage={league.annualIncreasePercentage}
        onConfirm={executeSeasonTurnover}
        isProcessing={isProcessing}
      />
    </div>
  );
}

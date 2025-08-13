'use client';

import React, { useState, useMemo } from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/utils/formatUtils';

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

interface SeasonTurnoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractChanges: ContractChange[];
  summary?: SeasonTurnoverSummary | null;
  annualIncreasePercentage: number;
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
}

/**
 * Modal de pré-visualização da virada de temporada
 * Mostra todas as alterações contratuais antes da confirmação
 */
export function SeasonTurnoverModal({
  isOpen,
  onClose,
  contractChanges,
  summary,
  annualIncreasePercentage,
  onConfirm,
  isProcessing,
}: SeasonTurnoverModalProps) {
  // Todos os hooks devem vir antes de qualquer return condicional
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(true); // Mudança: iniciar com "Ver Todos" ativo
  const itemsPerPage = 10;

  // Reset estado quando modal abrir
  React.useEffect(() => {
    if (isOpen) {
      setSelectedTeam('all');
      setCurrentPage(1);
      setIsConfirming(false);
      setShowAll(true); // Mudança: manter "Ver Todos" ativo por padrão
    }
  }, [isOpen]);

  // Obter lista única de times
  const teams = useMemo(() => {
    const uniqueTeams = Array.from(new Set(contractChanges.map(change => change.teamName))).sort();
    return uniqueTeams;
  }, [contractChanges]);

  // Filtrar contratos por time selecionado
  const filteredContracts = useMemo(() => {
    if (selectedTeam === 'all') {
      return contractChanges;
    }
    return contractChanges.filter(change => change.teamName === selectedTeam);
  }, [contractChanges, selectedTeam]);

  // Calcular paginação
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = showAll ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = showAll ? filteredContracts.length : startIndex + itemsPerPage;
  const paginatedContracts = filteredContracts.slice(startIndex, endIndex);

  // Reset página quando mudar filtro
  const handleTeamChange = (team: string) => {
    setSelectedTeam(team);
    setCurrentPage(1);
    setShowAll(true); // Mudança: manter "Ver Todos" ativo ao trocar filtro
  };

  // Agora sim podemos fazer o return condicional
  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Elegível para Extensão':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'Elegível para Tag':
        return 'text-red-400 bg-red-900/20';
      default:
        return 'text-green-400 bg-green-900/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={isProcessing || isConfirming ? undefined : onClose}
      />

      {/* Modal - Estrutura com 3 blocos: cabeçalho fixo, área de scroll, rodapé fixo */}
      <div className="relative bg-slate-800 rounded-xl border border-slate-700 shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden z-10">
        {/* BLOCO 1: CABEÇALHO FIXO - Header + Aviso + Filtros */}
        <div className="flex-shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                Pré-visualização da Virada de Temporada
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Aumento anual de {annualIncreasePercentage}% será aplicado aos contratos com mais de
                0 anos restantes
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing || isConfirming}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Aviso */}
          <div className="p-6 border-b border-slate-700">
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-200">Atenção</h3>
                  <p className="text-sm text-yellow-100 mt-1">
                    Esta ação é irreversível. Todos os contratos ativos terão seus anos reduzidos em
                    1. Contratos com mais de 1 ano restante terão salários aumentados em{' '}
                    {annualIncreasePercentage}%. Contratos que chegarem a 0 anos manterão o salário
                    atual. Verifique cuidadosamente as alterações abaixo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtro por time e Resumo */}
          <div className="p-6 border-b border-slate-700">
            <div className="mb-4">
              <label
                htmlFor="team-filter"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Filtrar por time:
              </label>
              <select
                id="team-filter"
                value={selectedTeam}
                onChange={e => handleTeamChange(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full max-w-xs p-2.5"
              >
                <option value="all">Todos os times ({contractChanges.length} contratos)</option>
                {teams.map(team => {
                  const teamCount = contractChanges.filter(
                    change => change.teamName === team,
                  ).length;
                  return (
                    <option key={team} value={team}>
                      {team} ({teamCount} contratos)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Resumo - 3 categorias consolidadas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Contratos Afetados */}
              <div className="bg-slate-700 rounded-lg p-4 border-l-4 border-blue-400">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {summary?.contractsAffected || filteredContracts.length}
                    </div>
                    <div className="text-sm text-slate-400">Contratos Afetados</div>
                  </div>
                </div>
              </div>

              {/* Elegíveis para Extensão */}
              <div className="bg-slate-700 rounded-lg p-4 border-l-4 border-yellow-400">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🟨</div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {summary?.eligibleForExtension ||
                        filteredContracts.filter(
                          c => c.newYearsRemaining === 0 && !c.hasBeenExtended,
                        ).length}
                    </div>
                    <div className="text-sm text-slate-400">Elegíveis para Extensão</div>
                  </div>
                </div>
              </div>

              {/* Elegíveis para Tag */}
              <div className="bg-slate-700 rounded-lg p-4 border-l-4 border-red-400">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🟥</div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">
                      {summary?.eligibleForFranchiseTag ||
                        filteredContracts.filter(c => c.newYearsRemaining === 0 && !c.hasBeenTagged)
                          .length}
                    </div>
                    <div className="text-sm text-slate-400">Elegíveis para Tag</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 2: ÁREA DE SCROLL PARA CONTRATOS - Altura flexível e otimizada */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {contractChanges.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-100 mb-2">
                Nenhum contrato ativo encontrado
              </h3>
              <p className="text-slate-400">
                Não há contratos ativos para processar na virada de temporada.
              </p>
            </div>
          ) : (
            <div
              className="h-full overflow-y-auto overflow-x-hidden px-6 py-2 
                        scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600 
                        hover:scrollbar-thumb-slate-500 scrollbar-thumb-rounded-md"
            >
              <table className="w-full table-fixed">
                <thead className="bg-slate-700 sticky top-0 z-20 shadow-lg border-b-2 border-slate-600">
                  <tr className="bg-slate-700">
                    <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700 border-b border-slate-600">
                      Jogador
                    </th>
                    <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700 border-b border-slate-600">
                      Time
                    </th>
                    <th className="w-1/5 px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700 border-b border-slate-600">
                      Anos Restantes
                    </th>
                    <th className="w-1/5 px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700 border-b border-slate-600">
                      Salário
                    </th>
                    <th className="w-1/5 px-4 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider bg-slate-700 border-b border-slate-600">
                      Novo Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 bg-slate-800">
                  {paginatedContracts.map(change => (
                    <tr key={change.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="w-1/5 px-4 py-4 text-sm font-medium text-slate-100 truncate">
                        {change.playerName}
                      </td>
                      <td className="w-1/5 px-4 py-4 text-sm text-slate-300 truncate">
                        {change.teamName}
                      </td>
                      <td className="w-1/5 px-4 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-sm text-slate-400">
                            {change.currentYearsRemaining}
                          </span>
                          <span className="text-slate-500">→</span>
                          <span className="text-sm font-medium text-slate-100">
                            {change.newYearsRemaining}
                          </span>
                        </div>
                      </td>
                      <td className="w-1/5 px-4 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-sm text-slate-400">
                            {formatCurrency(change.currentSalary)}
                          </span>
                          <span className="text-slate-500">→</span>
                          <span
                            className={`text-sm font-medium ${
                              change.newSalary === change.currentSalary
                                ? 'text-yellow-400' // Salário mantido (contrato expirando)
                                : 'text-slate-100' // Salário aumentado
                            }`}
                          >
                            {formatCurrency(change.newSalary)}
                          </span>
                        </div>
                      </td>
                      <td className="w-1/5 px-4 py-4 text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(change.newStatus)}`}
                        >
                          {change.newStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* BLOCO 3: RODAPÉ FIXO - Paginação + Botões de Ação */}
        <div className="flex-shrink-0">
          {/* Paginação */}
          {filteredContracts.length > itemsPerPage && (
            <div className="flex items-center justify-between p-4 border-t border-slate-700">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-400">
                  {showAll
                    ? `Mostrando todos os ${filteredContracts.length} contratos`
                    : `Mostrando ${startIndex + 1} a ${Math.min(endIndex, filteredContracts.length)} de ${filteredContracts.length} contratos`}
                  {selectedTeam !== 'all' && ` (filtrado por ${selectedTeam})`}
                </div>
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showAll ? 'Paginar' : 'Ver Todos'}
                </button>
              </div>

              {!showAll && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-slate-300">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer - Botões de Ação */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-slate-700 bg-slate-800/50">
            <button
              onClick={onClose}
              disabled={isProcessing || isConfirming}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing || isConfirming || contractChanges.length === 0}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {(isProcessing || isConfirming) && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isProcessing || isConfirming ? 'Processando...' : 'Aplicar Alterações'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

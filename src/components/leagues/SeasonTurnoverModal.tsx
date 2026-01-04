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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 transition-opacity"
        onClick={isProcessing || isConfirming ? undefined : onClose}
      />

      {/* Modal - Estrutura com 3 blocos */}
      <div className="relative bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden z-10 ring-1 ring-slate-700/50">
        {/* BLOCO 1: CABEÇALHO FIXO - Header + Aviso + Filtros */}
        <div className="flex-shrink-0 bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800/50">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-100">
                Virada de Temporada
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center rounded-md bg-blue-400/10 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-400/20">
                  Aumento Anual +{annualIncreasePercentage}%
                </span>
                <span className="text-sm text-slate-500">
                  Aplicado a contratos com &gt;0 anos restantes
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing || isConfirming}
              className="p-2 text-slate-400 hover:text-slate-100 transition-colors disabled:opacity-50 rounded-lg hover:bg-slate-800"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Aviso */}
          <div className="px-6 py-4 border-b border-slate-800">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg h-fit">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-yellow-500">Ação Irreversível</h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  Todos os contratos ativos serão reduzidos em 1 ano. Contratos restantes receberão
                  aumento de {annualIncreasePercentage}%. Contratos zerados terão salário resetado.
                  <span className="text-slate-300 font-medium ml-1">
                    Verifique as alterações abaixo.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Filtro e Resumo */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <div className="flex flex-col md:flex-row gap-6 items-end justify-between">
              <div className="w-full md:w-64 space-y-2">
                <label
                  htmlFor="team-filter"
                  className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Filtrar por Time
                </label>
                <select
                  id="team-filter"
                  value={selectedTeam}
                  onChange={e => handleTeamChange(e.target.value)}
                  className="w-full bg-slate-800 border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                >
                  <option value="all">Todos os Times ({contractChanges.length})</option>
                  {teams.map(team => (
                    <option key={team} value={team}>
                      {team} ({contractChanges.filter(c => c.teamName === team).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3 w-full md:w-auto flex-1 md:ml-6">
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-slate-200 block mb-1">
                    {summary?.contractsAffected || filteredContracts.length}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    Contratos
                  </span>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 border border-yellow-500/20 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-yellow-500 block mb-1">
                    {summary?.eligibleForExtension ||
                      filteredContracts.filter(c => c.newYearsRemaining === 0 && !c.hasBeenExtended)
                        .length}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    Extensões
                  </span>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 border border-red-500/20 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-red-400 block mb-1">
                    {summary?.eligibleForFranchiseTag ||
                      filteredContracts.filter(c => c.newYearsRemaining === 0 && !c.hasBeenTagged)
                        .length}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    Tags
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 2: SCROLL */}
        <div className="flex-1 min-h-0 overflow-hidden bg-slate-900/30">
          {contractChanges.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500">
              <CheckCircleIcon className="h-16 w-16 text-slate-700 mb-4" />
              <h3 className="text-lg font-medium text-slate-300">Nenhum contrato ativo</h3>
              <p>Não há alterações previstas para esta virada.</p>
            </div>
          ) : (
            <div
              className="h-full overflow-y-auto overflow-x-hidden
                        scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600"
            >
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-slate-900 shadow-sm">
                  <tr>
                    <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-900 border-b border-slate-800">
                      Jogador
                    </th>
                    <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-900 border-b border-slate-800">
                      Time
                    </th>
                    <th className="py-3 px-6 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-900 border-b border-slate-800">
                      Anos
                    </th>
                    <th className="py-3 px-6 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-900 border-b border-slate-800">
                      Salário
                    </th>
                    <th className="py-3 px-6 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-900 border-b border-slate-800">
                      Novo Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {paginatedContracts.map(change => (
                    <tr key={change.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="block text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                          {change.playerName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{change.teamName}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700">
                          <span className="text-sm text-slate-400 w-3 text-center">
                            {change.currentYearsRemaining}
                          </span>
                          <span className="text-slate-600">→</span>
                          <span
                            className={
                              change.newYearsRemaining === 0
                                ? 'text-red-400 font-bold'
                                : 'text-slate-200 font-bold'
                            }
                          >
                            {change.newYearsRemaining}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={
                              change.newYearsRemaining === 0
                                ? 'text-sm font-bold text-red-400'
                                : 'text-sm font-medium text-slate-200'
                            }
                          >
                            {formatCurrency(change.newSalary)}
                          </span>
                          {change.newSalary !== change.currentSalary && (
                            <span className="text-xs text-slate-500 line-through">
                              {formatCurrency(change.currentSalary)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            change.newStatus === 'Contrato Ativo'
                              ? 'bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20'
                              : change.newStatus === 'Elegível para Tag'
                                ? 'bg-red-400/10 text-red-400 ring-1 ring-inset ring-red-400/20'
                                : 'bg-yellow-400/10 text-yellow-500 ring-1 ring-inset ring-yellow-400/20'
                          }`}
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

        {/* BLOCO 3: FOOTER */}
        <div className="flex-shrink-0 border-t border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Pagination Controls */}
            {filteredContracts.length > itemsPerPage && (
              <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
                <div className="flex items-center rounded-lg bg-slate-800 p-1 border border-slate-700">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-medium text-slate-400 px-3 tabular-nums">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  {showAll ? 'Ver por Página' : 'Ver Todos'}
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={onClose}
                disabled={isProcessing || isConfirming}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing || isConfirming || contractChanges.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-red-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing || isConfirming ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <span>Confirmar Virada</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useContracts } from '@/hooks/useContracts';
import { useAuth } from '@/hooks/useAuth';
import { ContractsTable } from '@/components/contracts/ContractsTable';
import { toast } from 'sonner';
import { ContractWithPlayer, ContractStatus } from '@/types';

function ContractsContent() {
  const { contracts, loading } = useContracts();
  const { canImportLeague } = useAuth();
  const searchParams = useSearchParams();

  // Estados para filtros e paginação
  const [filteredContracts, setFilteredContracts] = useState<ContractWithPlayer[]>([]);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearsRemainingFilter, setYearsRemainingFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [contractsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState<'name' | 'position' | 'salary' | 'yearsRemaining'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Aplicar filtros baseados nos parâmetros de query da URL
  useEffect(() => {
    const status = searchParams.get('status');
    const yearsRemaining = searchParams.get('yearsRemaining');

    if (status) {
      setStatusFilter(status);
    }

    if (yearsRemaining) {
      setYearsRemainingFilter(yearsRemaining);
    }
  }, [searchParams]);

  // Aplicar filtros e ordenação
  useEffect(() => {
    let filtered = [...contracts];

    // Aplicar filtro de texto
    if (filterText) {
      filtered = filtered.filter(
        contract =>
          contract.player.name.toLowerCase().includes(filterText.toLowerCase()) ||
          contract.player.nflTeam?.toLowerCase().includes(filterText.toLowerCase()),
      );
    }

    // Aplicar filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    // Aplicar filtro de anos restantes
    if (yearsRemainingFilter !== 'all') {
      const years = parseInt(yearsRemainingFilter);
      filtered = filtered.filter(contract => contract.yearsRemaining === years);
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortBy) {
        case 'name':
          valueA = a.player.name;
          valueB = b.player.name;
          break;
        case 'position':
          valueA = a.player.position;
          valueB = b.player.position;
          break;
        case 'salary':
          valueA = a.currentSalary;
          valueB = b.currentSalary;
          break;
        case 'yearsRemaining':
          valueA = a.yearsRemaining;
          valueB = b.yearsRemaining;
          break;
        default:
          valueA = a.player.name;
          valueB = b.player.name;
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      } else {
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      }
    });

    setFilteredContracts(filtered);
    setCurrentPage(1); // Reset para primeira página quando filtros mudam
  }, [contracts, filterText, statusFilter, yearsRemainingFilter, sortBy, sortOrder]);

  // Calcular contratos da página atual
  const indexOfLastContract = currentPage * contractsPerPage;
  const indexOfFirstContract = indexOfLastContract - contractsPerPage;
  const currentContracts = filteredContracts.slice(indexOfFirstContract, indexOfLastContract);
  const totalPages = Math.ceil(filteredContracts.length / contractsPerPage);

  // Obter status únicos para o filtro
  const uniqueStatuses = Array.from(new Set(contracts.map(contract => contract.status))).sort();

  // Obter anos restantes únicos para o filtro
  const uniqueYearsRemaining = Array.from(
    new Set(contracts.map(contract => contract.yearsRemaining)),
  ).sort((a, b) => a - b);

  // Função para traduzir status
  const translateStatus = (status: string) => {
    const translations: { [key: string]: string } = {
      ACTIVE: 'Ativo',
      EXPIRED: 'Expirado',
      TAGGED: 'Tagueado',
      EXTENDED: 'Estendido',
      CUT: 'Cortado',
    };
    return translations[status] || status;
  };

  return (
    <div className="min-h-screen bg-background">
      <div>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          </div>

          {/* Barra de Filtros */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              {/* Busca por texto */}
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                >
                  Buscar
                </label>
                <input
                  type="text"
                  id="search"
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                  placeholder="Nome do jogador..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Filtro por status */}
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                >
                  <option
                    value="all"
                    className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                  >
                    Todos os status
                  </option>
                  {uniqueStatuses.map(status => (
                    <option
                      key={status}
                      value={status}
                      className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                    >
                      {translateStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por anos restantes */}
              <div>
                <label
                  htmlFor="yearsRemaining"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                >
                  Anos Restantes
                </label>
                <select
                  id="yearsRemaining"
                  value={yearsRemainingFilter}
                  onChange={e => setYearsRemainingFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                >
                  <option
                    value="all"
                    className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                  >
                    Todos os anos
                  </option>
                  {uniqueYearsRemaining.map(years => (
                    <option
                      key={years}
                      value={years.toString()}
                      className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                    >
                      {years} {years === 1 ? 'ano' : 'anos'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ordenação */}
              <div>
                <label
                  htmlFor="sort"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                >
                  Ordenar por
                </label>
                <div className="flex gap-2">
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={e =>
                      setSortBy(e.target.value as 'name' | 'position' | 'salary' | 'yearsRemaining')
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                  >
                    <option
                      value="name"
                      className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                    >
                      Nome
                    </option>
                    <option
                      value="position"
                      className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                    >
                      Posição
                    </option>
                    <option
                      value="salary"
                      className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                    >
                      Salário
                    </option>
                    <option
                      value="yearsRemaining"
                      className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                    >
                      Anos Restantes
                    </option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            {/* Botão para limpar filtros */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setFilterText('');
                  setStatusFilter('all');
                  setYearsRemainingFilter('all');
                  setSortBy('name');
                  setSortOrder('asc');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                Limpar Filtros
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Carregando contratos...</p>
            </div>
          ) : (
            <>
              <ContractsTable contracts={currentContracts} />

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-6 rounded-lg shadow-sm">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próximo
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-200">
                        Mostrando <span className="font-medium">{indexOfFirstContract + 1}</span> a{' '}
                        <span className="font-medium">
                          {Math.min(indexOfLastContract, filteredContracts.length)}
                        </span>{' '}
                        de <span className="font-medium">{filteredContracts.length}</span> contratos
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            const distance = Math.abs(page - currentPage);
                            return distance <= 2 || page === 1 || page === totalPages;
                          })
                          .map((page, index, array) => {
                            const showEllipsis = index > 0 && array[index - 1] !== page - 1;
                            return (
                              <div key={page}>
                                {showEllipsis && (
                                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200">
                                    ...
                                  </span>
                                )}
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === page
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  {page}
                                </button>
                              </div>
                            );
                          })}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Próximo
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContractsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-400">Carregando contratos...</p>
          </div>
        </div>
      }
    >
      <ContractsContent />
    </Suspense>
  );
}

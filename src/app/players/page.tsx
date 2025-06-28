'use client';

import { useState, useEffect } from 'react';
import { usePlayers } from '@/hooks/usePlayers';
import { useAuth } from '@/hooks/useAuth';
import { PlayersTable } from '@/components/players/PlayersTable';
import { Sidebar } from '@/components/layout/Sidebar';
import { Player } from '@/types';

export interface ImportProgress {
  step: 'fetching' | 'saving' | 'complete';
  message: string;
  progress: number;
}

export default function PlayersPage() {
  const { players, loading, refreshPlayers } = usePlayers();
  const { canImportLeague } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);

  // Estados para filtros e paginação
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [filterText, setFilterText] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [playersPerPage] = useState(25);
  const [sortBy, setSortBy] = useState<'name' | 'position' | 'nflTeam'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Aplicar filtros e ordenação
  useEffect(() => {
    let filtered = [...players];

    // Aplicar filtro de texto
    if (filterText) {
      filtered = filtered.filter(
        player =>
          player.name.toLowerCase().includes(filterText.toLowerCase()) ||
          player.nflTeam?.toLowerCase().includes(filterText.toLowerCase()),
      );
    }

    // Aplicar filtro de posição
    if (positionFilter !== 'all') {
      filtered = filtered.filter(player => player.position === positionFilter);
    }

    // Aplicar filtro de status
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(player => player.isActive === isActive);
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let valueA: string;
      let valueB: string;

      switch (sortBy) {
        case 'name':
          valueA = a.name;
          valueB = b.name;
          break;
        case 'position':
          valueA = a.position;
          valueB = b.position;
          break;
        case 'nflTeam':
          valueA = a.nflTeam || '';
          valueB = b.nflTeam || '';
          break;
        default:
          valueA = a.name;
          valueB = b.name;
      }

      return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    });

    setFilteredPlayers(filtered);
    setCurrentPage(1); // Reset para primeira página quando filtros mudam
  }, [players, filterText, positionFilter, statusFilter, sortBy, sortOrder]);

  // Calcular jogadores da página atual
  const indexOfLastPlayer = currentPage * playersPerPage;
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
  const currentPlayers = filteredPlayers.slice(indexOfFirstPlayer, indexOfLastPlayer);
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);

  // Obter posições únicas para o filtro
  const uniquePositions = Array.from(new Set(players.map(player => player.position))).sort();

  const handleImport = async () => {
    setImporting(true);
    setImportProgress({ step: 'fetching', message: 'Buscando jogadores...', progress: 0 });
    try {
      const res = await fetch('/api/players/import', { method: 'POST' });
      setImportProgress({ step: 'saving', message: 'Salvando jogadores...', progress: 50 });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao importar jogadores');
      }
      refreshPlayers();
      setImportProgress({ step: 'complete', message: 'Importação concluída', progress: 100 });
      alert(data.success ? `Importados ${data.imported} jogadores` : data.error);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao importar jogadores');
    } finally {
      setImporting(false);
      setTimeout(() => setImportProgress(null), 500);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">Jogadores</h1>
            {canImportLeague && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'Importando...' : 'Importar Jogadores'}
              </button>
            )}
          </div>

          {importProgress && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{importProgress.message}</span>
                <span>{importProgress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Barra de Filtros */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Busca por texto */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-900 mb-2">
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

              {/* Filtro por posição */}
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-900 mb-2">
                  Posição
                </label>
                <select
                  id="position"
                  value={positionFilter}
                  onChange={e => setPositionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                >
                  <option value="" className="text-gray-900">
                    Todas as posições
                  </option>
                  {uniquePositions.map(position => (
                    <option key={position} value={position} className="text-gray-900">
                      {position}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-900 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                >
                  <option value="" className="text-gray-900">
                    Todos os status
                  </option>
                  <option value="Ativo" className="text-gray-900">
                    Ativo
                  </option>
                  <option value="Inativo" className="text-gray-900">
                    Inativo
                  </option>
                  <option value="Lesionado" className="text-gray-900">
                    Lesionado
                  </option>
                </select>
              </div>

              {/* Ordenação */}
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-900 mb-2">
                  Ordenar por
                </label>
                <div className="flex gap-2">
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as 'name' | 'position' | 'nflTeam')}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                  >
                    <option value="name" className="text-gray-900">
                      Nome
                    </option>
                    <option value="position" className="text-gray-900">
                      Posição
                    </option>
                    <option value="nflTeam" className="text-gray-900">
                      Time NFL
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
                  setPositionFilter('');
                  setStatusFilter('');
                  setSortBy('name');
                  setSortOrder('asc');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                Limpar Filtros
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando jogadores...</p>
            </div>
          ) : (
            <>
              <PlayersTable players={currentPlayers} />

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
                      <p className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{indexOfFirstPlayer + 1}</span> a{' '}
                        <span className="font-medium">
                          {Math.min(indexOfLastPlayer, filteredPlayers.length)}
                        </span>{' '}
                        de <span className="font-medium">{filteredPlayers.length}</span> jogadores
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

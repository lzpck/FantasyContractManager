'use client';

import { useState, useMemo } from 'react';
import { usePlayers } from '@/hooks/usePlayers';
import { useContracts } from '@/hooks/useContracts';
import { Player, ContractWithPlayer, ContractStatus } from '@/types';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export function FreeAgentsReport() {
  const { players, loading: playersLoading } = usePlayers();
  const { contracts, loading: contractsLoading } = useContracts();

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const itemsPerPage = 20;

  // Filter free agents
  const freeAgents = useMemo(() => {
    if (playersLoading || contractsLoading) return [];

    // Get IDs of players with valid contracts (ACTIVE, TAGGED, EXTENDED)
    // Only players with EXPIRED or CUT (or no contract) should be considered free agents
    const validContractStatuses = [
      ContractStatus.ACTIVE,
      ContractStatus.TAGGED,
      ContractStatus.EXTENDED,
    ];

    const playersWithValidContracts = new Set(
      contracts
        .filter((c: ContractWithPlayer) => validContractStatuses.includes(c.status))
        .map((c: ContractWithPlayer) => c.playerId),
    );

    // Filter players who do NOT have valid contracts
    return players
      .filter((player: Player) => {
        const isFreeAgent = !playersWithValidContracts.has(player.id);
        const matchesActiveFilter = showOnlyActive ? player.isActive : true;
        const matchesSearch = searchTerm
          ? player.name.toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        const matchesPosition =
          positionFilter !== 'all' ? player.position === positionFilter : true;
        return isFreeAgent && matchesActiveFilter && matchesSearch && matchesPosition;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [
    players,
    contracts,
    playersLoading,
    contractsLoading,
    showOnlyActive,
    searchTerm,
    positionFilter,
  ]);

  // Pagination
  const totalPages = Math.ceil(freeAgents.length / itemsPerPage);
  const paginatedPlayers = freeAgents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Export functions
  const getExportData = () => {
    return freeAgents.map(p => ({
      Nome: p.name,
      Posição: p.position,
      Time: p.nflTeam || 'N/A',
      Ativo: p.isActive ? 'Sim' : 'Não',
    }));
  };

  const exportToCSV = () => {
    try {
      const data = getExportData();
      const headers = ['Nome', 'Posição', 'Time', 'Ativo'];
      const csvContent = [
        headers.join(','),
        ...data.map(row => [`"${row.Nome}"`, row.Posição, row.Time, row.Ativo].join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `free_agents_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Relatório CSV exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar relatório.');
    }
  };

  const exportToExcel = (extension: 'xlsx' | 'xls') => {
    try {
      const data = getExportData();
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Free Agents');
      XLSX.writeFile(wb, `free_agents_${new Date().toISOString().split('T')[0]}.${extension}`);
      toast.success(`Relatório ${extension.toUpperCase()} exportado com sucesso!`);
    } catch (error) {
      console.error(`Erro ao exportar ${extension}:`, error);
      toast.error('Erro ao exportar relatório.');
    }
  };

  if (playersLoading || contractsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
        <div className="flex-1 w-full md:w-auto grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Buscar por nome"
          />

          {/* Position Filter */}
          <select
            value={positionFilter}
            onChange={e => {
              setPositionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filtrar por posição"
          >
            <option value="all">Todas as Posições</option>
            <option value="QB">QB</option>
            <option value="RB">RB</option>
            <option value="WR">WR</option>
            <option value="TE">TE</option>
            <option value="K">K</option>
            <option value="DL">DL</option>
            <option value="LB">LB</option>
            <option value="DB">DB</option>
          </select>

          {/* Active Filter */}
          <div className="flex items-center">
            <input
              id="active-filter"
              type="checkbox"
              checked={showOnlyActive}
              onChange={e => {
                setShowOnlyActive(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="active-filter" className="ml-2 text-sm font-medium text-slate-300">
              Apenas Jogadores Ativos
            </label>
          </div>

          {/* Results Count */}
          <div className="text-slate-300 flex items-center">
            Total: <span className="font-bold text-white ml-1">{freeAgents.length}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
          >
            CSV
          </button>
          <button
            onClick={() => exportToExcel('xlsx')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
          >
            XLSX
          </button>
          <button
            onClick={() => exportToExcel('xls')}
            className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
          >
            XLS
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Posição
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Ativo
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {paginatedPlayers.length > 0 ? (
                paginatedPlayers.map(player => (
                  <tr key={player.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                      {player.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {player.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {player.nflTeam || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {player.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Sim
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Não
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    Nenhum jogador encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-t border-slate-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Mostrando{' '}
                  <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, freeAgents.length)}
                  </span>{' '}
                  de <span className="font-medium">{freeAgents.length}</span> resultados
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-600 bg-slate-800 text-sm font-medium text-slate-400 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-slate-600 bg-slate-800 text-sm font-medium text-slate-200">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-600 bg-slate-800 text-sm font-medium text-slate-400 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { useContracts } from '@/hooks/useContracts';
import { ContractWithPlayer, ContractStatus } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';

export function ActiveContractsReport() {
  const { contracts, loading } = useContracts();

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [salaryRange, setSalaryRange] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [timeRange, setTimeRange] = useState<'all' | 'expiring' | 'long'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract: ContractWithPlayer) => {
      // Must be active
      if (contract.status !== ContractStatus.ACTIVE) return false;

      // Search by name
      if (searchTerm && !contract.player.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Salary filter
      if (salaryRange !== 'all') {
        if (salaryRange === 'low' && contract.currentSalary >= 5) return false;
        if (salaryRange === 'medium' && (contract.currentSalary < 5 || contract.currentSalary > 15))
          return false;
        if (salaryRange === 'high' && contract.currentSalary <= 15) return false;
      }

      // Time filter
      if (timeRange !== 'all') {
        if (timeRange === 'expiring' && contract.yearsRemaining > 1) return false;
        if (timeRange === 'long' && contract.yearsRemaining <= 1) return false;
      }

      return true;
    });
  }, [contracts, searchTerm, salaryRange, timeRange]);

  // Pagination
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Export to CSV
  const exportToCSV = () => {
    try {
      const headers = ['Nome do Jogador', 'Salário', 'Tempo de Contrato'];
      const csvContent = [
        headers.join(','),
        ...filteredContracts.map((c: ContractWithPlayer) =>
          [`"${c.player.name}"`, c.currentSalary, c.yearsRemaining].join(','),
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `contratos_ativos_${new Date().toISOString().split('T')[0]}.csv`,
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar relatório.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
        <div className="flex-1 w-full md:w-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Buscar por nome"
          />

          {/* Salary Filter */}
          <select
            value={salaryRange}
            onChange={e => setSalaryRange(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filtrar por salário"
          >
            <option value="all">Todos os Salários</option>
            <option value="low">Baixo (&lt; $5M)</option>
            <option value="medium">Médio ($5M - $15M)</option>
            <option value="high">Alto (&gt; $15M)</option>
          </select>

          {/* Time Filter */}
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-slate-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filtrar por tempo de contrato"
          >
            <option value="all">Todos os Prazos</option>
            <option value="expiring">Expirando (1 ano)</option>
            <option value="long">Longo Prazo (&gt; 1 ano)</option>
          </select>
        </div>

        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center gap-2"
        >
          <span>📥</span> Exportar CSV
        </button>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Nome do Jogador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Salário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Tempo de Contrato
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {paginatedContracts.length > 0 ? (
                paginatedContracts.map((contract: ContractWithPlayer) => (
                  <tr key={contract.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">
                      {contract.player.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {formatCurrency(contract.currentSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {contract.yearsRemaining} {contract.yearsRemaining === 1 ? 'ano' : 'anos'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                    Nenhum contrato encontrado com os filtros selecionados.
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
                    {Math.min(currentPage * itemsPerPage, filteredContracts.length)}
                  </span>{' '}
                  de <span className="font-medium">{filteredContracts.length}</span> resultados
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
                  {/* Simplified pagination for now */}
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

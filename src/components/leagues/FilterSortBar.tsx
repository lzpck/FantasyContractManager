'use client';

import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

interface FilterSortBarProps {
  /** Texto do filtro atual */
  filterText: string;
  /** Função chamada quando o filtro muda */
  onFilterChange: (text: string) => void;
  /** Campo de ordenação atual */
  sortBy: 'name' | 'availableCap' | 'totalSalaries';
  /** Função chamada quando o campo de ordenação muda */
  onSortByChange: (field: 'name' | 'availableCap' | 'totalSalaries') => void;
  /** Ordem de ordenação atual */
  sortOrder: 'asc' | 'desc';
  /** Função chamada quando a ordem de ordenação muda */
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

/**
 * Componente de barra de filtros e ordenação para lista de times
 *
 * Permite filtrar times por nome e ordenar por diferentes campos
 * como nome, cap disponível e salários totais.
 */
export function FilterSortBar({
  filterText,
  onFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: FilterSortBarProps) {
  // Opções de ordenação
  const sortOptions = [
    { value: 'name', label: 'Nome do Time' },
    { value: 'availableCap', label: 'Cap Disponível' },
    { value: 'totalSalaries', label: 'Salários Totais' },
  ] as const;

  // Função para alternar ordem de ordenação
  const toggleSortOrder = () => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Função para limpar filtros
  const clearFilters = () => {
    onFilterChange('');
    onSortByChange('name');
    onSortOrderChange('asc');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Seção de filtro */}
        <div className="flex-1 max-w-md">
          <label htmlFor="filter" className="sr-only">
            Filtrar times
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="filter"
              value={filterText}
              onChange={e => onFilterChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Filtrar por nome do time..."
            />
          </div>
        </div>

        {/* Seção de ordenação */}
        <div className="flex items-center space-x-4">
          {/* Ícone de filtro */}
          <div className="flex items-center text-sm text-gray-600">
            <FunnelIcon className="h-4 w-4 mr-1" />
            <span>Ordenar por:</span>
          </div>

          {/* Seletor de campo de ordenação */}
          <select
            value={sortBy}
            onChange={e => onSortByChange(e.target.value as typeof sortBy)}
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Botão de ordem de ordenação */}
          <button
            onClick={toggleSortOrder}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title={`Ordenar ${sortOrder === 'asc' ? 'decrescente' : 'crescente'}`}
          >
            {sortOrder === 'asc' ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" />
            )}
          </button>

          {/* Botão para limpar filtros */}
          {(filterText || sortBy !== 'name' || sortOrder !== 'asc') && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Indicadores de filtros ativos */}
      {(filterText || sortBy !== 'name' || sortOrder !== 'asc') && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Filtros ativos:</span>

            {filterText && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Texto: &quot;{filterText}&quot;
                <button
                  onClick={() => onFilterChange('')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}

            {(sortBy !== 'name' || sortOrder !== 'asc') && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Ordenação: {sortOptions.find(opt => opt.value === sortBy)?.label}(
                {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'})
                <button
                  onClick={() => {
                    onSortByChange('name');
                    onSortOrderChange('asc');
                  }}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

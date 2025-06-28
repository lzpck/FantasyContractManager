'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useContracts } from '@/hooks/useContracts';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import { Contract } from '@/types';

function ContractsContent() {
  const { user } = useAuth();
  const { contracts, loading, error } = useContracts();
  const searchParams = useSearchParams();
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);

  // Aplicar filtros baseados nos parâmetros da URL
  useEffect(() => {
    if (!contracts) return;

    let filtered = [...contracts];

    // Filtro por status
    const statusFilter = searchParams.get('status');
    if (statusFilter === 'active') {
      filtered = filtered.filter(contract => contract.status === 'ACTIVE');
    }

    // Filtro por anos restantes
    const yearsRemainingFilter = searchParams.get('yearsRemaining');
    if (yearsRemainingFilter) {
      const years = parseInt(yearsRemainingFilter);
      filtered = filtered.filter(contract => contract.yearsRemaining === years);
    }

    setFilteredContracts(filtered);
  }, [contracts, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando contratos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Erro ao carregar contratos</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'TAGGED':
        return 'bg-yellow-100 text-yellow-800';
      case 'EXTENDED':
        return 'bg-blue-100 text-blue-800';
      case 'CUT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
            <p className="text-gray-600 mt-2">Gerencie todos os seus contratos de jogadores.</p>
          </div>

          {/* Filtros aplicados */}
          {(searchParams.get('status') || searchParams.get('yearsRemaining')) && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Filtros aplicados:</h3>
              <div className="flex gap-2">
                {searchParams.get('status') === 'active' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Contratos Ativos
                  </span>
                )}
                {searchParams.get('yearsRemaining') === '1' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Vencendo em 1 ano
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tabela de Contratos */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Contratos ({filteredContracts.length})
              </h3>
            </div>

            {filteredContracts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">
                  Nenhum contrato encontrado com os filtros aplicados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jogador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salário Atual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Anos Restantes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time NFL
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContracts.map(contract => (
                      <tr key={contract.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {contract.player.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{contract.player.position}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatSalary(contract.currentSalary)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {contract.yearsRemaining}{' '}
                            {contract.yearsRemaining === 1 ? 'ano' : 'anos'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}
                          >
                            {contract.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {contract.player.team || 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContractsPage() {
  return (
    <ProtectedRoute>
      <ContractsContent />
    </ProtectedRoute>
  );
}

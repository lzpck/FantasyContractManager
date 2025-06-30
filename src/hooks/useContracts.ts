import { useState, useEffect } from 'react';
import { Contract } from '@/types';
import { useAuth } from './useAuth';

/**
 * Hook para gerenciar contratos
 * 
 * Carrega dados reais da API.
 */
export function useContracts() {
  const { isAuthenticated } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContracts() {
      try {
        setLoading(true);
        setError(null);

        if (!isAuthenticated) {
          setContracts([]);
          return;
        }

        // Carregar dados da API
        const response = await fetch('/api/contracts');

        if (!response.ok) {
          throw new Error('Erro ao carregar contratos');
        }

        const data = await response.json();
        setContracts(data.contracts || []);
      } catch (err) {
        console.error('Erro ao carregar contratos:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setContracts([]);
      } finally {
        setLoading(false);
      }
    }

    loadContracts();
  }, [isAuthenticated]);

  return {
    contracts,
    loading,
    error,
  };
}

/**
 * Hook para buscar contratos de uma liga específica
 */
export function useLeagueContracts(leagueId: string) {
  const { contracts, loading, error } = useContracts();

  const leagueContracts = contracts.filter(contract => contract.leagueId === leagueId);

  return {
    contracts: leagueContracts,
    loading,
    error,
    totalContracts: leagueContracts.length,
    activeContracts: leagueContracts.filter(c => c.status === 'ACTIVE').length,
    expiringContracts: leagueContracts.filter(c => c.status === 'ACTIVE' && c.yearsRemaining === 1)
      .length,
  };
}

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { ContractWithPlayer } from '@/types';

/**
 * Hook para gerenciar contratos
 *
 * Para o usuário demo, retorna dados fictícios.
 * Para outros usuários, carrega dados reais da API.
 */
export function useContracts() {
  // Removido sistema demo
  const [contracts, setContracts] = useState<ContractWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContracts() {
      try {
        setLoading(true);
        setError(null);

        // Carrega dados da API
        const response = await fetch('/api/contracts');

        if (!response.ok) {
          throw new Error('Erro ao carregar contratos');
        }

        const data = await response.json();
        setContracts(data || []);
      } catch (err) {
        console.error('Erro ao carregar contratos:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    loadContracts();
  }, []);

  // Funções utilitárias para filtrar contratos
  const getActiveContracts = () => {
    return contracts.filter(contract => contract.status === 'ACTIVE');
  };

  const getExpiringContracts = () => {
    return contracts.filter(
      contract => contract.status === 'ACTIVE' && contract.yearsRemaining === 1,
    );
  };

  const getContractsByTeam = (teamId: string) => {
    return contracts.filter(contract => contract.teamId === teamId);
  };

  const getContractsByLeague = (leagueId: string) => {
    return contracts.filter(contract => contract.leagueId === leagueId);
  };

  return {
    contracts,
    loading,
    error,
    // Funções utilitárias
    getActiveContracts,
    getExpiringContracts,
    getContractsByTeam,
    getContractsByLeague,
    // Estatísticas
    totalContracts: contracts.length,
    activeContracts: getActiveContracts().length,
    expiringContracts: getExpiringContracts().length,
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

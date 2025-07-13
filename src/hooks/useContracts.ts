import useSWR from 'swr';
import { ContractWithPlayer, ContractStatus } from '@/types';

// Fetcher function para SWR
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Erro ao carregar contratos');
  }
  const data = await response.json();
  return data || [];
};

/**
 * Hook para gerenciar contratos
 *
 * Usa SWR para cache automático e deduplicação de requisições.
 */
export function useContracts() {
  const {
    data: contracts = [],
    error,
    isLoading,
    mutate,
  } = useSWR('/api/contracts', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minuto de cache
  });

  // Funções utilitárias para filtrar contratos
  const getActiveContracts = () => {
    return contracts.filter(
      (contract: ContractWithPlayer) => contract.status === ContractStatus.ACTIVE,
    );
  };

  const getExpiringContracts = () => {
    return contracts.filter(
      (contract: ContractWithPlayer) =>
        contract.status === ContractStatus.ACTIVE && contract.yearsRemaining === 1,
    );
  };

  const getContractsByTeam = (teamId: string) => {
    return contracts.filter((contract: ContractWithPlayer) => contract.teamId === teamId);
  };

  const getContractsByLeague = (leagueId: string) => {
    return contracts.filter((contract: ContractWithPlayer) => contract.leagueId === leagueId);
  };

  return {
    contracts,
    loading: isLoading,
    error: error?.message || null,
    // Funções utilitárias
    getActiveContracts,
    getExpiringContracts,
    getContractsByTeam,
    getContractsByLeague,
    // Estatísticas
    totalContracts: contracts.length,
    activeContracts: getActiveContracts().length,
    expiringContracts: getExpiringContracts().length,
    // Função para revalidar dados
    refreshContracts: mutate,
  };
}

/**
 * Hook para buscar contratos de uma liga específica
 */
export function useLeagueContracts(leagueId: string) {
  const { contracts, loading, error } = useContracts();

  const leagueContracts = contracts.filter(
    (contract: ContractWithPlayer) => contract.leagueId === leagueId,
  );

  return {
    contracts: leagueContracts,
    loading,
    error,
    totalContracts: leagueContracts.length,
    activeContracts: leagueContracts.filter(
      (c: ContractWithPlayer) => c.status === ContractStatus.ACTIVE,
    ).length,
    expiringContracts: leagueContracts.filter(
      (c: ContractWithPlayer) => c.status === ContractStatus.ACTIVE && c.yearsRemaining === 1,
    ).length,
  };
}

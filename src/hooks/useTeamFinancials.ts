import { useMemo } from 'react';
import useSWR from 'swr';
import { Contract, DeadMoney } from '@/types';

// Interface para registros de dead money da API
interface DeadMoneyRecord {
  id: string;
  teamId: string;
  playerId: string;
  contractId?: string;
  amount: number;
  year: number;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  player?: {
    id: string;
    name: string;
    position: string;
    sleeperPlayerId: string;
  };
  contract?: {
    id: string;
    currentSalary: number;
    originalYears: number;
    signedSeason: number;
  };
  team?: {
    id: string;
    name: string;
  };
}

// Fetcher function para SWR
const fetcher = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      // Se for erro 404 ou 403, retorna array vazio ao invés de erro
      if (res.status === 404 || res.status === 403) {
        return [];
      }
      throw new Error(`Erro ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.warn('Erro ao buscar dados:', error);
    // Retorna array vazio em caso de erro para evitar quebra do componente
    return [];
  }
};

/**
 * Hook personalizado para buscar dados financeiros do time em tempo real
 * Busca contratos ativos e registros de dead money do banco de dados
 */
export function useTeamFinancials(teamId: string, leagueId: string) {
  // Busca contratos do time
  const {
    data: contractsResponse,
    error: contractsError,
    mutate: mutateContracts,
  } = useSWR<{ contracts: Contract[] }>(teamId ? `/api/teams/${teamId}/contracts` : null, fetcher, {
    refreshInterval: 0, // Não atualiza automaticamente
    revalidateOnFocus: true, // Revalida quando a janela ganha foco
    revalidateOnReconnect: true, // Revalida quando reconecta
  });

  // Busca registros de dead money do time
  const {
    data: deadMoneyRecords,
    error: deadMoneyError,
    mutate: mutateDeadMoney,
  } = useSWR<DeadMoneyRecord[]>(teamId ? `/api/teams/${teamId}/dead-money` : null, fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  // Função para revalidar todos os dados após mudanças
  const revalidateFinancials = () => {
    mutateContracts();
    mutateDeadMoney();
  };

  // Extrair contratos da resposta
  const contracts = contractsResponse?.contracts || contractsResponse || [];

  // Estados de loading e erro
  const isLoading = (!contractsResponse && !contractsError) || (!deadMoneyRecords && !deadMoneyError);
  const error = contractsError || deadMoneyError;

  // Garantir que sempre retornamos arrays válidos
  const safeContracts = Array.isArray(contracts) ? contracts : [];
  const safeDeadMoneyRecords = Array.isArray(deadMoneyRecords) ? deadMoneyRecords : [];

  return {
    contracts: safeContracts,
    deadMoneyRecords: safeDeadMoneyRecords,
    isLoading,
    error,
    revalidateFinancials,
  };
}

/**
 * Hook alternativo usando React Query (se preferir)
 * Descomente e instale @tanstack/react-query se quiser usar
 */
/*
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useTeamFinancialsQuery(teamId: string, leagueId: string) {
  const queryClient = useQueryClient();

  const contractsQuery = useQuery({
    queryKey: ['team-contracts', teamId],
    queryFn: () => fetcher(`/api/teams/${teamId}/contracts`),
    enabled: !!teamId,
    staleTime: 0, // Sempre considera os dados como stale
    cacheTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const deadMoneyQuery = useQuery({
    queryKey: ['team-dead-money', teamId],
    queryFn: () => fetcher(`/api/teams/${teamId}/dead-money`),
    enabled: !!teamId,
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
  });

  const revalidateFinancials = () => {
    queryClient.invalidateQueries({ queryKey: ['team-contracts', teamId] });
    queryClient.invalidateQueries({ queryKey: ['team-dead-money', teamId] });
  };

  return {
    contracts: contractsQuery.data || [],
    deadMoneyRecords: deadMoneyQuery.data || [],
    isLoading: contractsQuery.isLoading || deadMoneyQuery.isLoading,
    error: contractsQuery.error || deadMoneyQuery.error,
    revalidateFinancials,
  };
}
*/

import useSWR from 'swr';
import { useContracts } from './useContracts';
import { useLeagues } from './useLeagues';
import { Team, ContractStatus, ContractWithPlayer } from '@/types';

// Fetcher para SWR
const fetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar times');
  }

  const data = await response.json();
  return data.teams || [];
};

/**
 * Interface para dados de salary cap de um time
 */
export interface TeamSalaryCapData {
  teamId: string;
  teamName: string;
  leagueId: string;
  totalCap: number;
  usedCap: number;
  availableCap: number;
  usedPercentage: number;
  deadMoney: number;
  activeContracts: number;
  expiringContracts: number;
}

/**
 * Hook para gerenciar dados de salary cap
 */
export function useSalaryCap() {
  const { contracts, loading: contractsLoading } = useContracts();
  const { leagues, loading: leaguesLoading } = useLeagues();

  const {
    data: teams = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Team[]>('/api/teams', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minuto de cache
  });

  const loading = isLoading || contractsLoading || leaguesLoading;

  /**
   * Calcula dados de salary cap para todos os times
   */
  const calculateSalaryCapData = (): TeamSalaryCapData[] => {
    return teams.map(team => {
      const league = leagues.find(l => l.id === team.leagueId);
      const teamContracts = contracts.filter(
        (c: ContractWithPlayer) => c.teamId === team.id && c.status === ContractStatus.ACTIVE,
      );

      const totalCap = league?.salaryCap || 279000000; // Default $279M
      const contractsUsedCap = teamContracts.reduce(
        (sum: number, contract: ContractWithPlayer) => sum + contract.currentSalary,
        0,
      );
      const deadMoney = team.currentDeadMoney || 0;
      const usedCap = contractsUsedCap + deadMoney;
      const availableCap = totalCap - usedCap;
      const usedPercentage = (usedCap / totalCap) * 100;
      const expiringContracts = teamContracts.filter(
        (c: ContractWithPlayer) => c.yearsRemaining === 1,
      ).length;

      return {
        teamId: team.id,
        teamName: team.name,
        leagueId: team.leagueId,
        totalCap,
        usedCap,
        availableCap,
        usedPercentage,
        deadMoney: team.currentDeadMoney,
        activeContracts: teamContracts.length,
        expiringContracts,
      };
    });
  };

  /**
   * Calcula a média de cap utilizado por todas as ligas do usuário
   */
  const calculateAverageCapUsed = (): number => {
    const salaryCapData = calculateSalaryCapData();

    if (salaryCapData.length === 0) return 0;

    const totalPercentage = salaryCapData.reduce((sum, data) => sum + data.usedPercentage, 0);
    return totalPercentage / salaryCapData.length;
  };

  /**
   * Retorna dados de salary cap para uma liga específica
   */
  const getLeagueSalaryCapData = (leagueId: string): TeamSalaryCapData[] => {
    return calculateSalaryCapData().filter(data => data.leagueId === leagueId);
  };

  /**
   * Retorna times próximos de estourar o cap (acima de 90%)
   */
  const getTeamsNearCapLimit = (): TeamSalaryCapData[] => {
    return calculateSalaryCapData().filter(data => data.usedPercentage > 90);
  };

  return {
    teams,
    loading,
    error: error?.message || null,
    refreshTeams: mutate,
    // Funções de cálculo
    calculateSalaryCapData,
    calculateAverageCapUsed,
    getLeagueSalaryCapData,
    getTeamsNearCapLimit,
    // Dados calculados
    salaryCapData: calculateSalaryCapData(),
    averageCapUsed: calculateAverageCapUsed(),
    teamsNearLimit: getTeamsNearCapLimit(),
  };
}

/**
 * Hook para dados de salary cap de uma liga específica
 */
export function useLeagueSalaryCap(leagueId: string) {
  const { getLeagueSalaryCapData, loading, error } = useSalaryCap();

  const leagueData = getLeagueSalaryCapData(leagueId);

  return {
    teams: leagueData,
    loading,
    error,
    totalTeams: leagueData.length,
    averageUsedPercentage:
      leagueData.length > 0
        ? leagueData.reduce((sum, team) => sum + team.usedPercentage, 0) / leagueData.length
        : 0,
  };
}

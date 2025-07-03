import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useContracts } from './useContracts';
import { useLeagues } from './useLeagues';
import { Team, League, ContractStatus } from '@/types';

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
  // Removido sistema demo
  const { contracts, loading: contractsLoading } = useContracts();
  const { leagues, loading: leaguesLoading } = useLeagues();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);
        setError(null);

        // Buscar times da API
        const response = await fetch('/api/teams');

        if (!response.ok) {
          throw new Error('Erro ao carregar times');
        }

        const data = await response.json();
        setTeams(data.teams || []);
      } catch (err) {
        console.error('Erro ao carregar times:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    if (!contractsLoading && !leaguesLoading) {
      loadTeams();
    }
  }, [contractsLoading, leaguesLoading, leagues]);

  /**
   * Calcula dados de salary cap para todos os times
   */
  const calculateSalaryCapData = (): TeamSalaryCapData[] => {
    return teams.map(team => {
      const league = leagues.find(l => l.id === team.leagueId);
      const teamContracts = contracts.filter(
        c => c.teamId === team.id && c.status === ContractStatus.ACTIVE,
      );

      const totalCap = league?.salaryCap || 279000000; // Default $279M
      const usedCap = teamContracts.reduce((sum, contract) => sum + contract.currentSalary, 0);
      const availableCap = totalCap - usedCap - team.currentDeadMoney;
      const usedPercentage = (usedCap / totalCap) * 100;
      const expiringContracts = teamContracts.filter(c => c.yearsRemaining === 1).length;

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

  const isLoading = loading || contractsLoading || leaguesLoading;

  return {
    teams,
    loading: isLoading,
    error,
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

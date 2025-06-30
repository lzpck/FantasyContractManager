import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useContracts } from './useContracts';
import { useLeagues } from './useLeagues';
import { Team, League } from '@/types';

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
  const { isAuthenticated } = useAuth();
  const { contracts } = useContracts();
  const { leagues } = useLeagues();

  const calculateTeamSalaryCap = (teamId: string): TeamSalaryCapData | null => {
    if (!isAuthenticated || !contracts || !leagues) {
      return null;
    }

    const teamContracts = contracts.filter(contract => contract.teamId === teamId);
    const team = leagues.flatMap(league => league.teams || []).find(team => team.id === teamId);
    
    if (!team) {
      return null;
    }

    const totalCap = 200000000; // $200M salary cap padrão
    const usedCap = teamContracts.reduce((sum, contract) => sum + (contract.currentSalary || 0), 0);
    const availableCap = totalCap - usedCap;
    const usedPercentage = (usedCap / totalCap) * 100;
    const deadMoney = teamContracts.reduce((sum, contract) => sum + (contract.deadMoney || 0), 0);
    const activeContracts = teamContracts.filter(contract => contract.status === 'ACTIVE').length;
    const expiringContracts = teamContracts.filter(contract => 
      contract.yearsRemaining === 1 && contract.status === 'ACTIVE'
    ).length;

    return {
      teamId,
      teamName: team.name,
      leagueId: team.leagueId,
      totalCap,
      usedCap,
      availableCap,
      usedPercentage,
      deadMoney,
      activeContracts,
      expiringContracts,
    };
  };

  return {
    calculateTeamSalaryCap,
  };
}

'use client';

/**
 * HOOK PARA OPERAÇÕES DE CONTRATO
 *
 * Centraliza toda a lógica de negócio relacionada a contratos,
 * incluindo validações, cálculos e operações CRUD.
 */

import { useState, useCallback } from 'react';
import {
  Player,
  Contract,
  Team,
  League,
  ContractStatus,
  DeadMoneyConfig,
  DEFAULT_DEAD_MONEY_CONFIG,
} from '@/types';
import { formatCurrency } from '@/utils/formatUtils';
import { calculateDeadMoney } from '@/utils/contractUtils';

interface ContractOperationResult {
  success: boolean;
  message: string;
  data?: any;
}

interface UseContractOperationsProps {
  team: Team;
  league: League;
  onUpdate?: () => void;
}

/**
 * Hook para gerenciar operações de contrato
 *
 * Fornece funções para criar, editar, estender e gerenciar contratos
 * com validações automáticas e feedback de erro.
 */
export function useContractOperations({ team, league, onUpdate }: UseContractOperationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Validar dados do contrato
  const validateContract = useCallback(
    (contractData: Partial<Contract>): string[] => {
      const errors: string[] = [];

      // Validações básicas
      if (!contractData.totalValue || contractData.totalValue <= 0) {
        errors.push('Valor total do contrato deve ser maior que zero');
      }

      if (!contractData.years || contractData.years < 1 || contractData.years > 10) {
        errors.push('Duração do contrato deve ser entre 1 e 10 anos');
      }

      if (!contractData.guaranteedMoney || contractData.guaranteedMoney < 0) {
        errors.push('Dinheiro garantido não pode ser negativo');
      }

      if (
        contractData.guaranteedMoney &&
        contractData.totalValue &&
        contractData.guaranteedMoney > contractData.totalValue
      ) {
        errors.push('Dinheiro garantido não pode ser maior que o valor total');
      }

      // Validar contra salary cap (apenas se league e salaryCap estiverem definidos)
      if (
        league &&
        league.salaryCap &&
        contractData.currentSalary &&
        contractData.currentSalary > league.salaryCap * 0.3
      ) {
        errors.push('Salário atual não pode exceder 30% do salary cap');
      }

      return errors;
    },
    [league?.salaryCap],
  );

  // Calcular valores do contrato
  const calculateContractValues = useCallback((contractData: Partial<Contract>) => {
    const totalValue = contractData.totalValue || 0;
    const years = contractData.years || 1;
    const guaranteedMoney = contractData.guaranteedMoney || 0;

    // Salário médio anual
    const averageAnnualValue = totalValue / years;

    // Salário atual (primeiro ano)
    const currentSalary = contractData.currentSalary || averageAnnualValue;

    // Cap hit (impacto no salary cap)
    const capHit = currentSalary + (contractData.bonuses || 0);

    // Dead money (se cortado)
    const deadMoney = guaranteedMoney - (contractData.paidGuaranteed || 0);

    return {
      averageAnnualValue,
      currentSalary,
      capHit,
      deadMoney: Math.max(0, deadMoney),
    };
  }, []);

  // Criar novo contrato
  const createContract = useCallback(
    async (player: Player, contractData: Partial<Contract>): Promise<ContractOperationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // Validar dados
        const validationErrors = validateContract(contractData);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join(', '));
        }

        // Calcular valores
        const calculatedValues = calculateContractValues(contractData);

        // Verificar se league está definido
        if (!league || !league.id || league.season === undefined) {
          throw new Error('Dados da liga não estão disponíveis');
        }

        // Criar objeto do contrato
        const newContract: Contract = {
          id: `contract_${Date.now()}`, // Em produção, seria gerado pelo backend
          playerId: player.id,
          teamId: team.id,
          leagueId: league.id,
          totalValue: contractData.totalValue!,
          years: contractData.years!,
          guaranteedMoney: contractData.guaranteedMoney || 0,
          currentSalary: calculatedValues.currentSalary,
          averageAnnualValue: calculatedValues.averageAnnualValue,
          bonuses: contractData.bonuses || 0,
          incentives: contractData.incentives || 0,
          status: ContractStatus.ACTIVE,
          signedDate: new Date(),
          startYear: league.season,
          endYear: league.season + contractData.years! - 1,
          yearsRemaining: contractData.years!,
          paidGuaranteed: 0,
          capHit: calculatedValues.capHit,
          deadMoney: calculatedValues.deadMoney,
          isRookieContract: contractData.isRookieContract || false,
          canExtend: true,
          canTag: true,
          notes: contractData.notes || '',
        };

        // Fazer chamada real à API
        console.log('🔵 Criando contrato via API:', newContract);

        const payload = {
          playerId: player.id,
          teamId: team.id,
          leagueId: league.id,
          originalSalary: newContract.currentSalary,
          currentSalary: newContract.currentSalary,
          originalYears: newContract.years,
          yearsRemaining: newContract.yearsRemaining,
          acquisitionType: contractData.acquisitionType || 'auction',
          hasFourthYearOption: contractData.hasFourthYearOption || false,
          hasBeenTagged: contractData.hasBeenTagged || false,
          hasBeenExtended: contractData.hasBeenExtended || false,
          fourthYearOptionActivated: contractData.fourthYearOptionActivated || false,
          signedSeason: league.season,
          status: 'ACTIVE',
        };

        const response = await fetch('/api/contracts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Erro ao criar contrato');
        }

        const result = await response.json();
        console.log('🔵 Contrato criado com sucesso:', result);

        // Disparar evento de atualização
        window.dispatchEvent(
          new CustomEvent('contractCreated', {
            detail: { contract: result, player },
          }),
        );

        if (onUpdate) {
          onUpdate();
        }

        return {
          success: true,
          message: `Contrato criado com sucesso para ${player.name}`,
          data: result,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setError(errorMessage);

        return {
          success: false,
          message: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [team.id, league?.id, league?.season, validateContract, calculateContractValues, onUpdate],
  );

  // Editar contrato existente
  const updateContract = useCallback(
    async (contract: Contract, updates: Partial<Contract>): Promise<ContractOperationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // Mesclar dados
        const updatedContractData = { ...contract, ...updates };

        // Validar dados
        const validationErrors = validateContract(updatedContractData);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join(', '));
        }

        // Recalcular valores se necessário
        const calculatedValues = calculateContractValues(updatedContractData);

        const updatedContract: Contract = {
          ...updatedContractData,
          currentSalary: calculatedValues.currentSalary,
          averageAnnualValue: calculatedValues.averageAnnualValue,
          capHit: calculatedValues.capHit,
          deadMoney: calculatedValues.deadMoney,
          lastModified: new Date(),
        };

        // Fazer chamada real à API
        console.log('🔵 Atualizando contrato via API:', updatedContract);

        const payload = {
          playerId: updatedContract.playerId,
          teamId: updatedContract.teamId,
          leagueId: updatedContract.leagueId,
          originalSalary: updatedContract.originalSalary,
          currentSalary: updatedContract.currentSalary,
          originalYears: updatedContract.originalYears,
          yearsRemaining: updatedContract.yearsRemaining,
          acquisitionType: updatedContract.acquisitionType,
          hasFourthYearOption: updatedContract.hasFourthYearOption,
          hasBeenTagged: updatedContract.hasBeenTagged,
          hasBeenExtended: updatedContract.hasBeenExtended,
          fourthYearOptionActivated: updatedContract.fourthYearOptionActivated,
          signedSeason: updatedContract.signedSeason,
          status: updatedContract.status,
        };

        const response = await fetch(`/api/contracts/${contract.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Erro ao atualizar contrato');
        }

        const result = await response.json();
        console.log('🔵 Contrato atualizado com sucesso:', result);

        // Disparar evento de atualização
        window.dispatchEvent(
          new CustomEvent('contractUpdated', {
            detail: { contract: result },
          }),
        );

        if (onUpdate) {
          onUpdate();
        }

        return {
          success: true,
          message: 'Contrato atualizado com sucesso',
          data: result,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setError(errorMessage);

        return {
          success: false,
          message: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [validateContract, calculateContractValues, onUpdate],
  );

  // Estender contrato
  const extendContract = useCallback(
    async (
      contract: Contract,
      extensionYears: number,
      extensionValue: number,
      additionalGuaranteed: number = 0,
    ): Promise<ContractOperationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // Validações específicas para extensão
        if (extensionYears < 1 || extensionYears > 5) {
          throw new Error('Extensão deve ser entre 1 e 5 anos');
        }

        if (extensionValue <= 0) {
          throw new Error('Valor da extensão deve ser maior que zero');
        }

        if (contract.yearsRemaining < 1) {
          throw new Error('Não é possível estender contrato que já expirou');
        }

        // Calcular novos valores
        const newTotalValue = contract.totalValue + extensionValue;
        const newTotalYears = contract.years + extensionYears;
        const newGuaranteedMoney = contract.guaranteedMoney + additionalGuaranteed;
        const newEndYear = contract.endYear + extensionYears;

        const extendedContract: Contract = {
          ...contract,
          totalValue: newTotalValue,
          years: newTotalYears,
          guaranteedMoney: newGuaranteedMoney,
          averageAnnualValue: newTotalValue / newTotalYears,
          endYear: newEndYear,
          lastModified: new Date(),
          notes: `${contract.notes || ''} | Extensão: +${extensionYears} anos, +${formatCurrency(extensionValue)}`,
        };

        // Recalcular valores
        const calculatedValues = calculateContractValues(extendedContract);
        extendedContract.capHit = calculatedValues.capHit;
        extendedContract.deadMoney = calculatedValues.deadMoney;

        console.log('Estendendo contrato:', extendedContract);

        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Disparar evento de atualização
        window.dispatchEvent(
          new CustomEvent('contractExtended', {
            detail: { contract: extendedContract, extensionYears, extensionValue },
          }),
        );

        if (onUpdate) {
          onUpdate();
        }

        return {
          success: true,
          message: `Contrato estendido por ${extensionYears} anos`,
          data: extendedContract,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setError(errorMessage);

        return {
          success: false,
          message: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [calculateContractValues, onUpdate],
  );

  // Aplicar Franchise Tag
  const applyFranchiseTag = useCallback(
    async (player: Player, tagValue: number): Promise<ContractOperationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // Validações para franchise tag
        if (tagValue <= 0) {
          throw new Error('Valor da franchise tag deve ser maior que zero');
        }

        // Verificar se league está definido
        if (!league || !league.id || league.season === undefined) {
          throw new Error('Dados da liga não estão disponíveis');
        }

        // Criar contrato de franchise tag
        const franchiseContract: Contract = {
          id: `franchise_${Date.now()}`,
          playerId: player.id,
          teamId: team.id,
          leagueId: league.id,
          totalValue: tagValue,
          years: 1,
          guaranteedMoney: tagValue, // Franchise tag é totalmente garantida
          currentSalary: tagValue,
          averageAnnualValue: tagValue,
          bonuses: 0,
          incentives: 0,
          status: ContractStatus.ACTIVE,
          signedDate: new Date(),
          startYear: league.season,
          endYear: league.season,
          yearsRemaining: 1,
          paidGuaranteed: 0,
          capHit: tagValue,
          deadMoney: tagValue,
          isRookieContract: false,
          canExtend: false, // Franchise tag não pode ser estendida
          canTag: false, // Não pode aplicar tag novamente
          notes: 'Franchise Tag',
        };

        console.log('Aplicando franchise tag:', franchiseContract);

        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Disparar evento de atualização
        window.dispatchEvent(
          new CustomEvent('franchiseTagApplied', {
            detail: { contract: franchiseContract, player },
          }),
        );

        if (onUpdate) {
          onUpdate();
        }

        return {
          success: true,
          message: `Franchise tag aplicada para ${player.name}`,
          data: franchiseContract,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setError(errorMessage);

        return {
          success: false,
          message: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [team.id, league?.id, league?.season, onUpdate],
  );

  // Cortar jogador
  const cutPlayer = useCallback(
    async (player: Player, contract: Contract): Promise<ContractOperationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // Obter configuração de dead money da liga
        let deadMoneyConfig = DEFAULT_DEAD_MONEY_CONFIG;
        if (league.deadMoneyConfig) {
          try {
            deadMoneyConfig =
              typeof league.deadMoneyConfig === 'string'
                ? JSON.parse(league.deadMoneyConfig)
                : league.deadMoneyConfig;
          } catch (error) {
            console.warn(
              'Erro ao fazer parse da configuração de dead money, usando padrão:',
              error,
            );
          }
        }

        // Calcular dead money usando a configuração da liga
        const deadMoneyResult = calculateDeadMoney(contract, player.rosterStatus, deadMoneyConfig);
        const deadMoney = deadMoneyResult.currentSeason + deadMoneyResult.nextSeason;

        // Atualizar contrato como cortado
        const cutContract: Contract = {
          ...contract,
          status: ContractStatus.TERMINATED,
          deadMoney: Math.max(0, deadMoney),
          lastModified: new Date(),
          notes: `${contract.notes || ''} | Jogador cortado em ${new Date().toLocaleDateString()}`,
        };

        console.log('Cortando jogador:', { player, contract: cutContract, deadMoney });

        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Disparar evento de atualização
        window.dispatchEvent(
          new CustomEvent('playerCut', {
            detail: { contract: cutContract, player, deadMoney },
          }),
        );

        if (onUpdate) {
          onUpdate();
        }

        return {
          success: true,
          message: `${player.name} foi cortado. Dead money: ${formatCurrency(deadMoney)}`,
          data: { contract: cutContract, deadMoney },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setError(errorMessage);

        return {
          success: false,
          message: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [onUpdate],
  );

  return {
    // Estados
    isLoading,
    error,

    // Funções
    createContract,
    updateContract,
    extendContract,
    applyFranchiseTag,
    cutPlayer,
    validateContract,
    calculateContractValues,
    clearError,
  };
}

export type { ContractOperationResult };

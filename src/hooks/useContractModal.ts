'use client';

import { useState } from 'react';
import { Contract, Player } from '@/types';
import { useAuth } from './useAuth';

interface ContractModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  contract?: Contract;
  player?: Player;
  teamId?: string;
  leagueId?: string;
}

export function useContractModal() {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<ContractModalState>({
    isOpen: false,
    mode: 'create',
  });

  const openCreateModal = (teamId: string, leagueId: string, player?: Player) => {
    setState({
      isOpen: true,
      mode: 'create',
      teamId,
      leagueId,
      player,
    });
  };

  const openEditModal = (contract: Contract) => {
    setState({
      isOpen: true,
      mode: 'edit',
      contract,
    });
  };

  const openViewModal = (contract: Contract) => {
    setState({
      isOpen: true,
      mode: 'view',
      contract,
    });
  };

  const closeModal = () => {
    setState({
      isOpen: false,
      mode: 'create',
    });
  };

  const createContract = async (contractData: any) => {
    if (!isAuthenticated) {
      return { success: false, message: 'Usuário não autenticado' };
    }

    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar contrato');
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  };

  const updateContract = async (contractId: string, contractData: any) => {
    if (!isAuthenticated) {
      return { success: false, message: 'Usuário não autenticado' };
    }

    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar contrato');
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  };

  return {
    ...state,
    openCreateModal,
    openEditModal,
    openViewModal,
    closeModal,
    createContract,
    updateContract,
  };
}

/**
 * Hook simplificado para verificar se o usuário pode usar o modal
 */
export function useCanManageContracts(): boolean {
  const { user } = useAuth();
  return user?.isCommissioner === true || user?.role === 'COMMISSIONER';
}
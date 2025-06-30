'use client';

import { useState, useCallback } from 'react';
import { Player, Contract, Team, League } from '@/types';
import { useAuth } from './useAuth';

interface ContractFormData {
  contractYears: number;
  annualSalary: number;
  acquisitionType: string;
  hasFourthYearOption: boolean;
  hasBeenTagged: boolean;
  hasBeenExtended: boolean;
  fourthYearOptionActivated: boolean;
}

interface UseContractModalReturn {
  isOpen: boolean;
  player: Player | null;
  team: Team | null;
  league: League | null;
  contract: Contract | null;
  isLoading: boolean;
  error: string | null;
  openModal: (player: Player, team: Team, league: League, contract?: Contract) => void;
  closeModal: () => void;
  saveContract: (contractData: ContractFormData) => Promise<void>;
}

/**
 * Hook para gerenciar o modal de contratos
 *
 * Fornece funcionalidades para:
 * - Abrir/fechar modal
 * - Gerenciar estado do formulário
 * - Salvar/atualizar contratos
 * - Integração com API ou dados demo
 */
export function useContractModal(): UseContractModalReturn {
  const { isDemoUser, user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Abre o modal com os dados necessários
   */
  const openModal = useCallback(
    (player: Player, team: Team, league: League, contract?: Contract) => {
      setPlayer(player);
      setTeam(team);
      setLeague(league);
      setContract(contract || null);
      setError(null);
      setIsOpen(true);
    },
    [],
  );

  /**
   * Fecha o modal e limpa o estado
   */
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setPlayer(null);
    setTeam(null);
    setLeague(null);
    setContract(null);
    setError(null);
  }, []);

  /**
   * Salva ou atualiza um contrato
   */
  const saveContract = useCallback(
    async (contractData: ContractFormData) => {
      if (!player || !team || !league) {
        setError('Dados incompletos para salvar o contrato');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (isDemoUser) {
          // Para usuário demo, simular salvamento
          await new Promise(resolve => setTimeout(resolve, 1000));

          console.log('Contrato salvo (modo demo):', {
            player: player.name,
            team: team.name,
            league: league.name,
            isEdit: !!contract,
            contractData,
          });

          // Aqui você pode atualizar o estado local/contexto se necessário
          // Por exemplo, disparar um evento ou callback para atualizar a lista
        } else {
          // Para usuários reais, fazer chamada à API
          const isEdit = !!contract;
          const url = isEdit ? `/api/contracts/${contract.id}` : '/api/contracts';
          const method = isEdit ? 'PUT' : 'POST';

          const payload = {
            playerId: player.id,
            teamId: team.id,
            leagueId: league.id,
            originalSalary: contractData.annualSalary,
            currentSalary: contractData.annualSalary,
            originalYears: contractData.contractYears,
            yearsRemaining: contractData.contractYears,
            acquisitionType: contractData.acquisitionType,
            hasFourthYearOption: contractData.hasFourthYearOption,
            hasBeenTagged: contractData.hasBeenTagged,
            hasBeenExtended: contractData.hasBeenExtended,
            fourthYearOptionActivated: contractData.fourthYearOptionActivated,
            signedSeason: league.season,
            status: 'active',
          };

          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao salvar contrato');
          }

          const result = await response.json();
          console.log('Contrato salvo com sucesso:', result);
        }

        // Fechar modal após sucesso
        closeModal();

        // Aqui você pode disparar um evento para recarregar dados
        // ou atualizar o contexto global
        window.dispatchEvent(
          new CustomEvent('contractUpdated', {
            detail: { player, team, league, isEdit: !!contract },
          }),
        );
      } catch (err) {
        console.error('Erro ao salvar contrato:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao salvar contrato');
      } finally {
        setIsLoading(false);
      }
    },
    [player, team, league, contract, isDemoUser, closeModal],
  );

  return {
    isOpen,
    player,
    team,
    league,
    contract,
    isLoading,
    error,
    openModal,
    closeModal,
    saveContract,
  };
}

/**
 * Hook simplificado para verificar se o usuário pode usar o modal
 */
export function useCanManageContracts(): boolean {
  const { user } = useAuth();
  return user?.isCommissioner === true || user?.role === 'COMMISSIONER';
}

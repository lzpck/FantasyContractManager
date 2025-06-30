'use client';

import React, { useState } from 'react';
import { PlayerAdded, PlayerRemoved } from '@/hooks/useRosterDiff';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useContractModal } from '@/hooks/useContractModal';
import ContractModal from '@/components/teams/ContractModal';
import { ActionButton } from '@/components/ui/action-button';
import { useAuth } from '@/hooks/useAuth';
import { Team, League, Player } from '@/types';

interface RosterTransactionsProps {
  playersAdded: PlayerAdded[];
  playersRemoved: PlayerRemoved[];
  team: Team;
  league: League;
  onAddContract: (sleeperPlayerId: string, teamId: string) => Promise<void>;
  onAddDeadMoney: (sleeperPlayerId: string, teamId: string) => Promise<void>;
  onContractSaved?: (sleeperPlayerId: string) => void;
}

/**
 * Componente que exibe as transações de roster detectadas
 */
export default function RosterTransactions({
  playersAdded,
  playersRemoved,
  team,
  league,
  onAddContract,
  onAddDeadMoney,
  onContractSaved,
}: RosterTransactionsProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const contractModal = useContractModal();
  const { user } = useAuth();
  const isCommissioner = user?.role === 'COMMISSIONER';

  if (playersAdded.length === 0 && playersRemoved.length === 0) {
    return null;
  }

  const handleAddContract = async (player: PlayerAdded) => {
    try {
      // Converter PlayerAdded para Player para o modal
      const playerForModal: Player = {
        id: player.playerId || player.sleeperPlayerId,
        name: player.name || `Jogador ${player.sleeperPlayerId}`,
        position: (player.position as any) || 'UNKNOWN',
        fantasyPositions: player.fantasyPositions
          ? (player.fantasyPositions.split(', ') as any[])
          : [],
        nflTeam: player.nflTeam || 'FA',
        age: player.age || null,
        sleeperPlayerId: player.sleeperPlayerId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Abrir modal de contrato
      contractModal.openModal(playerForModal, team, league);

      // Feedback visual de que o modal foi aberto
      toast.info(`Abrindo modal de contrato para ${player.name || player.sleeperPlayerId}`);
    } catch (error) {
      console.error('Erro ao abrir modal de contrato:', error);
      toast.error('Erro ao abrir modal de contrato');
    }
  };

  const handleAddDeadMoney = async (player: PlayerRemoved) => {
    const actionKey = `deadmoney-${player.sleeperPlayerId}`;
    setLoadingStates(prev => ({ ...prev, [actionKey]: true }));

    try {
      await onAddDeadMoney(player.sleeperPlayerId, player.teamId);
      toast.success(`Dead money adicionado para ${player.name || player.sleeperPlayerId}`);
    } catch (error) {
      console.error('Erro ao adicionar dead money:', error);
      toast.error('Erro ao adicionar dead money');
    } finally {
      setLoadingStates(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'ir':
        return 'secondary';
      case 'taxi':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'ir':
        return 'IR';
      case 'taxi':
        return 'Taxi';
      default:
        return status;
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Transações de Roster Detectadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Jogadores Adicionados */}
          {playersAdded.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Jogadores Adicionados ({playersAdded.length})
              </h3>
              <div className="space-y-3">
                {playersAdded.map(player => {
                  const actionKey = `add-${player.sleeperPlayerId}`;
                  const isLoading = loadingStates[actionKey];

                  return (
                    <div
                      key={`${player.teamId}-${player.sleeperPlayerId}`}
                      className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">
                            {player.name || `Jogador ${player.sleeperPlayerId}`}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {player.fantasyPositions && (
                              <Badge variant="secondary" className="text-xs">
                                {player.fantasyPositions}
                              </Badge>
                            )}
                            <span>{player.nflTeam || 'FA'}</span>
                            <span>•</span>
                            <span>Time: {player.teamName}</span>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(player.status)}>
                          {getStatusLabel(player.status)}
                        </Badge>
                      </div>
                      <ActionButton
                        variant="success"
                        icon={Plus}
                        onClick={() => handleAddContract(player)}
                        loading={isLoading}
                        loadingText="Abrindo..."
                      >
                        Adicionar Contrato
                      </ActionButton>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Separador */}
          {playersAdded.length > 0 && playersRemoved.length > 0 && <Separator />}

          {/* Jogadores Removidos */}
          {playersRemoved.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Jogadores Removidos ({playersRemoved.length})
              </h3>
              <div className="space-y-3">
                {playersRemoved.map(player => {
                  const actionKey = `deadmoney-${player.sleeperPlayerId}`;
                  const isLoading = loadingStates[actionKey];

                  return (
                    <div
                      key={`${player.teamId}-${player.sleeperPlayerId}`}
                      className="flex items-center justify-between p-3 border rounded-lg bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">
                            {player.name || player.playerName || player.sleeperPlayerId}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {player.fantasyPositions && (
                              <Badge variant="secondary" className="text-xs">
                                {player.fantasyPositions}
                              </Badge>
                            )}
                            {player.nflTeam && (
                              <>
                                <span>{player.nflTeam}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>Time: {player.teamName}</span>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(player.status)}>
                          {getStatusLabel(player.status)}
                        </Badge>
                      </div>
                      <ActionButton
                        variant="danger"
                        icon={Trash2}
                        onClick={() => handleAddDeadMoney(player)}
                        loading={isLoading}
                        loadingText="Adicionando..."
                      >
                        Adicionar Dead Money
                      </ActionButton>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <ContractModal
        isOpen={contractModal.isOpen}
        onClose={contractModal.closeModal}
        player={contractModal.player}
        team={contractModal.team}
        league={contractModal.league}
        contract={contractModal.contract}
        onSave={async (contractData) => {
          try {
            await contractModal.saveContract(contractData);
            // Remover jogador da lista após salvar contrato com sucesso
            if (contractModal.player && onContractSaved) {
              onContractSaved(contractModal.player.sleeperPlayerId);
            }
            // Exibir toast de sucesso
            toast.success(`Contrato criado com sucesso para ${contractModal.player?.name || 'jogador'}`);
          } catch (error) {
            // Em caso de erro, o toast de erro já é exibido pelo hook useContractModal
            console.error('Erro ao salvar contrato:', error);
          }
        }}
        isCommissioner={isCommissioner}
      />
    </>
  );
}

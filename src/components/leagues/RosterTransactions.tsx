'use client';

import React, { useState } from 'react';
import { PlayerAdded, PlayerRemoved } from '@/hooks/useRosterDiff';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useContractModal } from '@/hooks/useContractModal';
import ContractModal from '@/components/teams/ContractModal';
import { ActionButton } from '@/components/ui/action-button';
import { useAuth } from '@/hooks/useAuth';
import { Team, League, Player } from '@/types';

/**
 * Interface para trades processadas
 */
export interface TradeProcessed {
  isTraded: boolean;
  fromTeam?: string;
  toTeam?: string;
  playerName?: string;
  contractId?: string;
}

interface RosterTransactionsProps {
  playersAdded: PlayerAdded[];
  playersRemoved: PlayerRemoved[];
  tradesProcessed?: TradeProcessed[];
  teams: Team[];
  league: League;
  onAddContract: (sleeperPlayerId: string, teamId: string) => Promise<void>;
  onAddDeadMoney: (sleeperPlayerId: string, teamId: string) => Promise<void>;
  onProcessTrade?: (
    contractId: string,
    fromTeam: string,
    toTeam: string,
    playerName: string,
  ) => Promise<void>;
  onContractSaved?: (sleeperPlayerId: string) => void;
}

/**
 * Componente que exibe as transações de roster detectadas
 */
export default function RosterTransactions({
  playersAdded,
  playersRemoved,
  tradesProcessed = [],
  teams,
  league,
  onAddContract,
  onAddDeadMoney,
  onProcessTrade,
  onContractSaved,
}: RosterTransactionsProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const contractModal = useContractModal();
  const { user } = useAuth();
  const isCommissioner = user?.role === 'COMMISSIONER';

  // Filtrar jogadores que fazem parte de trades para evitar duplicação
  const validTrades = tradesProcessed.filter(
    trade =>
      trade.isTraded && trade.contractId && trade.fromTeam && trade.toTeam && trade.playerName,
  );

  // Criar lista de nomes de jogadores que estão em trades
  const playersInTradesNames = new Set<string>();
  validTrades.forEach(trade => {
    if (trade.playerName) {
      playersInTradesNames.add(trade.playerName.toLowerCase().trim());
    }
  });

  // Filtrar jogadores adicionados que não são resultado de trades
  const filteredPlayersAdded = playersAdded.filter(player => {
    // Se não há trades, mostrar todos os jogadores adicionados
    if (validTrades.length === 0) return true;

    // Se há trades, verificar se este jogador não está na lista de trades
    const playerName = (player.name || '').toLowerCase().trim();
    return !playersInTradesNames.has(playerName);
  });

  // Filtrar jogadores removidos que não são resultado de trades
  const filteredPlayersRemoved = playersRemoved.filter(player => {
    // Se não há trades, mostrar todos os jogadores removidos
    if (validTrades.length === 0) return true;

    // Se há trades, verificar se este jogador não está na lista de trades
    const playerName = (player.playerName || player.name || '').toLowerCase().trim();
    return !playersInTradesNames.has(playerName);
  });

  if (
    filteredPlayersAdded.length === 0 &&
    filteredPlayersRemoved.length === 0 &&
    validTrades.length === 0
  ) {
    return null;
  }

  const handleProcessTrade = async (trade: TradeProcessed) => {
    if (
      !onProcessTrade ||
      !trade.contractId ||
      !trade.fromTeam ||
      !trade.toTeam ||
      !trade.playerName
    )
      return;

    const actionKey = `trade-${trade.contractId}`;
    setLoadingStates(prev => ({ ...prev, [actionKey]: true }));

    try {
      await onProcessTrade(trade.contractId, trade.fromTeam, trade.toTeam, trade.playerName);
      toast.success(
        `Trade processada: ${trade.playerName} de ${trade.fromTeam} para ${trade.toTeam}`,
      );
    } catch (error) {
      console.error('Erro ao processar trade:', error);
      toast.error('Erro ao processar trade');
    } finally {
      setLoadingStates(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleAddContract = async (player: PlayerAdded) => {
    try {
      // Encontrar o time correto do jogador
      const playerTeam = teams.find(t => t.id === player.teamId);
      if (!playerTeam) {
        toast.error(`Time não encontrado para o jogador ${player.name || player.sleeperPlayerId}`);
        return;
      }

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

      // Abrir modal de contrato com o time correto
      contractModal.openModal(playerForModal, playerTeam, league);

      // Feedback visual de que o modal foi aberto
      toast.info(
        `Abrindo modal de contrato para ${player.name || player.sleeperPlayerId} - Time: ${playerTeam.name}`,
      );
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
          {filteredPlayersAdded.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Jogadores Adicionados ({filteredPlayersAdded.length})
              </h3>
              <div className="space-y-3">
                {filteredPlayersAdded.map(player => {
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
          {filteredPlayersAdded.length > 0 && filteredPlayersRemoved.length > 0 && <Separator />}

          {/* Jogadores Removidos */}
          {filteredPlayersRemoved.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Jogadores Removidos ({filteredPlayersRemoved.length})
              </h3>
              <div className="space-y-3">
                {filteredPlayersRemoved.map(player => {
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

          {/* Separador */}
          {(filteredPlayersAdded.length > 0 || filteredPlayersRemoved.length > 0) &&
            validTrades.length > 0 && <Separator />}

          {/* Trades Processadas */}
          {validTrades.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Trades Detectadas ({validTrades.length})
              </h3>
              <div className="space-y-3">
                {validTrades.map((trade, index) => {
                  const actionKey = `trade-${trade.contractId}`;
                  const isLoading = loadingStates[actionKey];

                  return (
                    <div
                      key={`${trade.contractId}-${index}`}
                      className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{trade.playerName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {trade.fromTeam}
                            </Badge>
                            <ArrowRightLeft className="h-3 w-3" />
                            <Badge variant="outline" className="text-xs">
                              {trade.toTeam}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {isCommissioner && (
                        <ActionButton
                          variant="default"
                          icon={ArrowRightLeft}
                          onClick={() => handleProcessTrade(trade)}
                          loading={isLoading}
                          loadingText="Processando..."
                        >
                          Processar Trade
                        </ActionButton>
                      )}
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
        onSave={async contractData => {
          try {
            await contractModal.saveContract(contractData);
            // Remover jogador da lista após salvar contrato com sucesso
            if (contractModal.player && onContractSaved) {
              onContractSaved(contractModal.player.sleeperPlayerId);
            }
            // Exibir toast de sucesso
            toast.success(
              `Contrato criado com sucesso para ${contractModal.player?.name || 'jogador'}`,
            );
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

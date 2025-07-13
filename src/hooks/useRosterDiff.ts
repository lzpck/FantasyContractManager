import { useState, useCallback } from 'react';
import { fetchSleeperRosters } from '@/services/sleeperService';
import { TradeProcessed } from '@/components/leagues/RosterTransactions';

/**
 * Representa um jogador que foi adicionado ao roster
 */
export interface PlayerAdded {
  sleeperPlayerId: string;
  teamId: string;
  teamName: string;
  status: 'active' | 'ir' | 'taxi';
  // Informações do jogador
  playerId?: string;
  name?: string;
  position?: string;
  fantasyPositions?: string;
  nflTeam?: string;
  age?: number;
}

/**
 * Representa um jogador que foi removido do roster
 */
export interface PlayerRemoved {
  sleeperPlayerId: string;
  teamId: string;
  teamName: string;
  playerName: string;
  status: 'active' | 'ir' | 'taxi';
  // Informações do jogador
  name?: string;
  position?: string;
  fantasyPositions?: string;
  nflTeam?: string;
}

/**
 * Resultado da comparação de rosters
 */
export interface RosterDiff {
  playersAdded: PlayerAdded[];
  playersRemoved: PlayerRemoved[];
  tradesProcessed?: TradeProcessed[];
}

/**
 * Estrutura de um jogador no roster atual (banco de dados)
 */
interface CurrentRosterPlayer {
  sleeperPlayerId: string;
  teamId: string;
  status: 'active' | 'ir' | 'taxi';
  player: {
    name: string;
  };
}

/**
 * Hook para detectar diferenças entre rosters do Sleeper e do banco de dados
 */
export function useRosterDiff() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Compara rosters atuais do banco com os rosters do Sleeper
   */
  const calculateRosterDiff = useCallback(
    async (
      sleeperLeagueId: string,
      currentRosters: CurrentRosterPlayer[],
      teams: Array<{ id: string; name: string; sleeperTeamId: string }>,
    ): Promise<RosterDiff> => {
      setIsLoading(true);
      setError(null);

      try {
        // Buscar rosters atuais do Sleeper
        const sleeperRosters = await fetchSleeperRosters(sleeperLeagueId);

        const playersAdded: PlayerAdded[] = [];
        const playersRemoved: PlayerRemoved[] = [];

        // Buscar informações dos jogadores do banco de dados
        const fetchPlayerInfo = async (sleeperPlayerId: string) => {
          try {
            const response = await fetch(`/api/players?sleeperPlayerId=${sleeperPlayerId}`);
            if (response.ok) {
              const player = await response.json();
              return {
                playerId: player.id,
                name: player.name,
                position: player.position,
                fantasyPositions: Array.isArray(player.fantasyPositions)
                  ? player.fantasyPositions.join(', ')
                  : player.fantasyPositions,
                nflTeam: player.nflTeam,
                age: player.age,
              };
            }
          } catch (error) {
            console.warn(`Erro ao buscar informações do jogador ${sleeperPlayerId}:`, error);
          }
          return null;
        };

        // Para cada time, comparar jogadores
        for (const team of teams) {
          const sleeperRoster = sleeperRosters.find(
            roster => roster.roster_id.toString() === team.sleeperTeamId,
          );

          if (!sleeperRoster) continue;

          // Jogadores atuais do time no banco
          const currentTeamPlayers = currentRosters.filter(player => player.teamId === team.id);

          // Jogadores atuais do time no banco (já definido acima)

          // Jogadores do Sleeper por status
          const sleeperPlayersByStatus = {
            active: sleeperRoster.players || [],
            ir: sleeperRoster.reserve || [],
            taxi: sleeperRoster.taxi || [],
          };

          // Detectar jogadores adicionados
          for (const [status, sleeperPlayers] of Object.entries(sleeperPlayersByStatus)) {
            for (const playerId of sleeperPlayers) {
              // Se o jogador não está no banco em nenhum status para este time
              const isInCurrentRoster = currentTeamPlayers.some(
                p => p.sleeperPlayerId === playerId,
              );

              if (!isInCurrentRoster) {
                const playerInfo = await fetchPlayerInfo(playerId);
                playersAdded.push({
                  sleeperPlayerId: playerId,
                  teamId: team.id,
                  teamName: team.name,
                  status: status as 'active' | 'ir' | 'taxi',
                  ...playerInfo,
                });
              }
            }
          }

          // Detectar jogadores removidos
          for (const currentPlayer of currentTeamPlayers) {
            // Verificar se o jogador ainda está no roster do Sleeper
            const isInSleeperRoster = [
              ...sleeperPlayersByStatus.active,
              ...sleeperPlayersByStatus.ir,
              ...sleeperPlayersByStatus.taxi,
            ].includes(currentPlayer.sleeperPlayerId);

            if (!isInSleeperRoster) {
              playersRemoved.push({
                sleeperPlayerId: currentPlayer.sleeperPlayerId,
                teamId: team.id,
                teamName: team.name,
                playerName: currentPlayer.player.name,
                status: currentPlayer.status,
                name: currentPlayer.player.name,
              });
            }
          }
        }

        return {
          playersAdded,
          playersRemoved,
          tradesProcessed: [], // Será preenchido pela API de sincronização
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    calculateRosterDiff,
    isLoading,
    error,
  };
}

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { PlayerWithContract } from '@/types';
import { getDemoPlayersWithContracts } from '@/data/demoData';

export interface TeamRosterData {
  active: PlayerWithContract[];
  reserve: PlayerWithContract[];
  taxi: PlayerWithContract[];
}

export function useTeamRoster(leagueId: string, teamId: string) {
  const { isDemoUser } = useAuth();
  const [roster, setRoster] = useState<TeamRosterData>({ active: [], reserve: [], taxi: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        if (isDemoUser) {
          const players = getDemoPlayersWithContracts(teamId);
          setRoster({ active: players, reserve: [], taxi: [] });
        } else {
          const response = await fetch(`/api/leagues/${leagueId}/teams/${teamId}/roster`);
          if (!response.ok) {
            throw new Error('Erro ao carregar roster');
          }
          const data = await response.json();
          const parse = (arr: any[]) =>
            (arr || []).map(p => ({
              ...p,
              player: {
                ...p.player,
                fantasyPositions: Array.isArray(p.player.fantasyPositions)
                  ? p.player.fantasyPositions
                  : p.player.fantasyPositions.split(',').filter((s: string) => s),
                nflTeam: p.player.nflTeam ?? p.player.team,
              },
            }));
          setRoster({
            active: parse(data.active),
            reserve: parse(data.reserve),
            taxi: parse(data.taxi),
          });
        }
      } catch (err) {
        console.error('Erro ao carregar roster:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setRoster({ active: [], reserve: [], taxi: [] });
      } finally {
        setLoading(false);
      }
    }
    if (leagueId && teamId) {
      load();
    }
  }, [isDemoUser, leagueId, teamId]);

  return { roster, loading, error };
}

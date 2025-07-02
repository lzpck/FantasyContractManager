import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { Player } from '@/types';

export function usePlayers() {
  // Removido sistema demo
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/players');
      if (!response.ok) {
        throw new Error('Erro ao carregar jogadores');
      }
      const data = await response.json();
      const parsed: Player[] = (data.players || []).map((p: any) => ({
        ...p,
        nflTeam: p.nflTeam ?? p.team,
        fantasyPositions: Array.isArray(p.fantasyPositions)
          ? p.fantasyPositions
          : p.fantasyPositions.split(',').filter((s: string) => s),
      }));
      setPlayers(parsed);
    } catch (err) {
      console.error('Erro ao carregar jogadores:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  return { players, loading, error, refreshPlayers: loadPlayers };
}

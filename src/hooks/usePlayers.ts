import { useState, useEffect } from 'react';
import { Player } from '@/types';
import { useAuth } from './useAuth';

export function usePlayers() {
  const { isAuthenticated } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlayers() {
      try {
        setLoading(true);
        setError(null);

        if (!isAuthenticated) {
          setPlayers([]);
          return;
        }

        // Carregar jogadores da API
        const response = await fetch('/api/players');

        if (!response.ok) {
          throw new Error('Erro ao carregar jogadores');
        }

        const data = await response.json();
        setPlayers(data.players || []);
      } catch (err) {
        console.error('Erro ao carregar jogadores:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }

    loadPlayers();
  }, [isAuthenticated]);

  return {
    players,
    loading,
    error,
  };
}

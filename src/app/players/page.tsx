'use client';

import { useState } from 'react';
import { usePlayers } from '@/hooks/usePlayers';
import { useAuth } from '@/hooks/useAuth';
import { PlayersTable } from '@/components/players/PlayersTable';
import { Sidebar } from '@/components/layout/Sidebar';

export default function PlayersPage() {
  const { players, loading, refreshPlayers } = usePlayers();
  const { canImportLeague } = useAuth();
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/players/import', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao importar jogadores');
      }
      refreshPlayers();
      alert(data.success ? `Importados ${data.imported} jogadores` : data.error);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao importar jogadores');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Jogadores</h1>
            {canImportLeague && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'Importando...' : 'Importar Jogadores'}
              </button>
            )}
          </div>
          {loading ? (
            <div className="text-center">Carregando...</div>
          ) : (
            <PlayersTable players={players} />
          )}
        </div>
      </div>
    </div>
  );
}

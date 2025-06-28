'use client';

import { useState } from 'react';
import { usePlayers } from '@/hooks/usePlayers';
import { useAuth } from '@/hooks/useAuth';
import { PlayersTable } from '@/components/players/PlayersTable';
import { Sidebar } from '@/components/layout/Sidebar';

export interface ImportProgress {
  step: 'fetching' | 'saving' | 'complete';
  message: string;
  progress: number;
}

export default function PlayersPage() {
  const { players, loading, refreshPlayers } = usePlayers();
  const { canImportLeague } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setImportProgress({ step: 'fetching', message: 'Buscando jogadores...', progress: 0 });
    try {
      const res = await fetch('/api/players/import', { method: 'POST' });
      setImportProgress({ step: 'saving', message: 'Salvando jogadores...', progress: 50 });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao importar jogadores');
      }
      refreshPlayers();
      setImportProgress({ step: 'complete', message: 'Importação concluída', progress: 100 });
      alert(data.success ? `Importados ${data.imported} jogadores` : data.error);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao importar jogadores');
    } finally {
      setImporting(false);
      setTimeout(() => setImportProgress(null), 500);
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
          {importProgress && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{importProgress.message}</span>
                <span>{importProgress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress.progress}%` }}
                ></div>
              </div>
            </div>
          )}
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

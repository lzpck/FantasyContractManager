'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLeagues } from '@/hooks/useLeagues';

import LeagueModal from '@/components/leagues/LeagueModal';
import { PlusIcon } from '@heroicons/react/24/outline';

/**
 * Página de listagem de ligas
 *
 * Responsável por redirecionar para a liga ativa ou permitir
 * a criação/importação da primeira liga caso não exista nenhuma.
 */
export default function LeaguesPage() {
  const router = useRouter();
  const { leagues, loading, error } = useLeagues();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Efeito para redirecionar caso já existam ligas
  useEffect(() => {
    if (!loading && leagues.length > 0) {
      // Redireciona para a primeira liga encontrada
      // Idealmente, poderia ser a última acessada ou a marcada como "principal"
      router.push(`/leagues/${leagues[0].id}`);
    }
  }, [loading, leagues, router]);

  // Se estiver carregando, mostra spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <span className="text-slate-400">Verificando ligas...</span>
        </div>
      </div>
    );
  }

  // Se houver erro na busca de ligas (não 404, mas erro de rede/server)
  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-red-900/20 border border-red-800 rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Erro ao carregar ligas</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl transition-colors font-semibold"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Se não houver ligas, mostra tela de boas-vindas/criação
  // Isso só será renderizado se !loading e leagues.length === 0
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Bem-vindo ao Fantasy Manager
          </h1>
          <p className="text-xl text-slate-400 max-w-lg mx-auto">
            Parece que você ainda não tem nenhuma liga configurada. Comece importando sua liga do
            Sleeper para ter acesso a todas as funcionalidades.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-200 bg-blue-600 rounded-xl hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
          >
            <span className="absolute inset-0 w-full h-full mt-1 ml-1 transition-all duration-200 ease-out bg-blue-900 rounded-xl group-hover:mt-0 group-hover:ml-0"></span>
            <span className="absolute inset-0 w-full h-full bg-blue-600 rounded-xl"></span>
            <span className="relative flex items-center">
              <PlusIcon className="w-5 h-5 mr-2" />
              Importar Liga do Sleeper
            </span>
          </button>
        </div>

        {/* Modal de Criação/Importação */}
        <LeagueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  );
}

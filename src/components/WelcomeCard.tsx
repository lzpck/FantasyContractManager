'use client';

import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { LeagueStatus } from '@/types';

/**
 * Componente de exemplo que demonstra o uso do contexto global
 * Exibe informações do usuário e das ligas disponíveis
 */
export function WelcomeCard() {
  const { state, addLeague } = useAppContext();
  const { user: authUser, isAuthenticated } = useAuth();

  // Função para adicionar uma liga de exemplo
  const handleAddMockLeague = () => {
    const newLeague = {
      id: `league-${Date.now()}`,
      name: 'Liga The Bad Place',
      season: 2024,
      salaryCap: 279000000, // $279 milhões
      totalTeams: 12,
      status: LeagueStatus.ACTIVE,
      commissionerId: authUser?.id || `user-${Date.now()}`,
      maxFranchiseTags: 1,
      annualIncreasePercentage: 15,
      minimumSalary: 1000000,
      seasonTurnoverDate: '2024-04-01',
      settings: {
        maxFranchiseTags: 1,
        annualIncreasePercentage: 15,
        minimumSalary: 1000000,
        seasonTurnoverDate: '04-01',
        rookieDraft: {
          rounds: 3,
          firstRoundFourthYearOption: true,
          salaryTable: [],
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addLeague(newLeague);
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden md:max-w-2xl m-6">
      <div className="md:flex">
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 dark:text-indigo-400 font-semibold">
            Fantasy Contract Manager
          </div>

          <h2 className="block mt-1 text-lg leading-tight font-medium text-foreground">
            Sistema de Gerenciamento de Contratos
          </h2>

          <div className="mt-4">
            {isAuthenticated && authUser ? (
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Usuário:</strong> {authUser.name}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Email:</strong> {authUser.email}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Perfil:</strong> {authUser.role}
                </p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">Nenhum usuário logado</p>
            )}
          </div>

          <div className="mt-4">
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Ligas disponíveis:</strong> {state.leagues.length}
            </p>

            {state.leagues.length > 0 && (
              <div className="mt-2 space-y-1">
                {state.leagues.map(league => (
                  <div key={league.id} className="text-sm text-gray-500 dark:text-gray-400">
                    • {league.name} ({league.season}) - Salary Cap: $
                    {(league.salaryCap / 1000000).toFixed(0)}M
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={handleAddMockLeague}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              Adicionar Liga
            </button>
          </div>

          {state.loading && <div className="mt-4 text-blue-600">Carregando...</div>}

          {state.error && <div className="mt-4 text-red-600">Erro: {state.error}</div>}
        </div>
      </div>
    </div>
  );
}

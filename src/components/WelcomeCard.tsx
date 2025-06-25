'use client';

import { useAppContext } from '@/contexts/AppContext';

/**
 * Componente de exemplo que demonstra o uso do contexto global
 * Exibe informações do usuário e das ligas disponíveis
 */
export function WelcomeCard() {
  const { state, setUser, addLeague } = useAppContext();

  // Função para simular login de usuário
  const handleMockLogin = () => {
    setUser({
      id: '1',
      name: 'João Silva',
      email: 'joao@example.com',
      avatar: undefined,
    });
  };

  // Função para adicionar uma liga de exemplo
  const handleAddMockLeague = () => {
    const newLeague = {
      id: `league-${Date.now()}`,
      name: 'Liga The Bad Place',
      season: 2024,
      salaryCap: 279000000, // $279 milhões
      totalTeams: 12,
      createdAt: new Date(),
    };
    addLeague(newLeague);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-6">
      <div className="md:flex">
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
            Fantasy Contract Manager
          </div>

          <h2 className="block mt-1 text-lg leading-tight font-medium text-black">
            Sistema de Gerenciamento de Contratos
          </h2>

          <div className="mt-4">
            {state.user ? (
              <div className="space-y-2">
                <p className="text-gray-600">
                  <strong>Usuário:</strong> {state.user.name}
                </p>
                <p className="text-gray-600">
                  <strong>Email:</strong> {state.user.email}
                </p>
              </div>
            ) : (
              <p className="text-gray-600">Nenhum usuário logado</p>
            )}
          </div>

          <div className="mt-4">
            <p className="text-gray-600">
              <strong>Ligas disponíveis:</strong> {state.leagues.length}
            </p>

            {state.leagues.length > 0 && (
              <div className="mt-2 space-y-1">
                {state.leagues.map(league => (
                  <div key={league.id} className="text-sm text-gray-500">
                    • {league.name} ({league.season}) - Salary Cap: $
                    {(league.salaryCap / 1000000).toFixed(0)}M
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 space-x-2">
            {!state.user && (
              <button
                onClick={handleMockLogin}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Login Simulado
              </button>
            )}

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

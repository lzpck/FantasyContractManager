'use client';

import { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { createMockLeagueWithTeams } from '@/types/mocks';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { SalaryCapChart } from '@/components/dashboard/SalaryCapChart';
import { LeaguesList } from '@/components/dashboard/LeaguesList';
import { Sidebar } from '@/components/layout/Sidebar';

/**
 * Conteúdo principal do Dashboard
 *
 * Exibe uma visão geral das ligas, contratos, salary cap e próximos vencimentos.
 * Utiliza dados mock para validar estrutura, layout e interação.
 */
function DashboardContent() {
  const { state, setLeagues, setUser } = useAppContext();
  const { user: authUser, isAuthenticated } = useAuth();

  // Inicializar dados mock na primeira renderização
  useEffect(() => {
    // Usar dados do usuário autenticado
    if (isAuthenticated && authUser && !state.user) {
      setUser({
        id: authUser.id,
        name: authUser.name || 'Usuário',
        email: authUser.email || '',
        avatar: authUser.image || undefined,
        role: authUser.role,
        isActive: true,
        isCommissioner: authUser.role === 'COMMISSIONER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Gerar dados mock de ligas se não existirem
    if (state.leagues.length === 0) {
      const mockData1 = createMockLeagueWithTeams(12);
      const mockData2 = createMockLeagueWithTeams(10);

      // Personalizar as ligas mock
      mockData1.league.name = 'Liga The Bad Place';
      mockData2.league.name = 'Liga Elite Fantasy';
      mockData2.league.id = 'league-2';

      setLeagues([mockData1.league, mockData2.league]);
    }
  }, [isAuthenticated, authUser, state.user, state.leagues.length, setUser, setLeagues]);

  // Calcular estatísticas para os cards de resumo
  const totalLeagues = state.leagues.length;
  const totalActiveContracts = state.leagues.reduce(
    (acc, league) => acc + league.totalTeams * 15,
    0,
  ); // Estimativa
  const averageCapAvailable = 50000000; // $50M média (mock)
  const contractsExpiringSoon = 23; // Mock

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar de navegação */}
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Visão geral do seu gerenciamento de contratos e salary cap
            </p>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SummaryCard
              title="Total de Ligas"
              value={totalLeagues.toString()}
              icon="🏆"
              trend={{ value: 0, isPositive: true }}
            />
            <SummaryCard
              title="Contratos Ativos"
              value={totalActiveContracts.toString()}
              icon="📋"
              trend={{ value: 5, isPositive: true }}
            />
            <SummaryCard
              title="Cap Médio Disponível"
              value={`$${(averageCapAvailable / 1000000).toFixed(1)}M`}
              icon="💰"
              trend={{ value: 2.5, isPositive: false }}
            />
            <SummaryCard
              title="Contratos Vencendo"
              value={contractsExpiringSoon.toString()}
              icon="⏰"
              trend={{ value: 8, isPositive: false }}
            />
          </div>

          {/* Grid principal com gráfico e lista de ligas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Gráfico de distribuição do salary cap */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Distribuição do Salary Cap por Time
                </h2>
                <SalaryCapChart leagues={state.leagues} />
              </div>
            </div>

            {/* Lista de ligas */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Suas Ligas</h2>
                <LeaguesList leagues={state.leagues} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Página principal do Dashboard com proteção de autenticação
 */
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

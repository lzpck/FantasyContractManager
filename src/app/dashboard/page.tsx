'use client';

import { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useLeagues } from '@/hooks/useLeagues';
import { useUserTeams } from '@/hooks/useTeams';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { SalaryCapChart } from '@/components/dashboard/SalaryCapChart';
import { LeaguesList } from '@/components/dashboard/LeaguesList';
import { Sidebar } from '@/components/layout/Sidebar';

/**
 * Conteúdo principal do Dashboard
 *
 * Exibe uma visão geral das ligas, contratos, salary cap e próximos vencimentos.
 * Para usuário demo, utiliza dados fictícios. Para outros usuários, carrega dados reais.
 */
function DashboardContent() {
  const { state, setUser } = useAppContext();
  const { user: authUser, isAuthenticated, isDemoUser } = useAuth();
  const { leagues, loading: leaguesLoading, error: leaguesError, hasLeagues } = useLeagues();
  const { loading: teamsLoading } = useUserTeams();

  // Inicializar dados do usuário autenticado
  useEffect(() => {
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
  }, [isAuthenticated, authUser, state.user, setUser]);

  // Estados de carregamento
  const isLoading = leaguesLoading || teamsLoading;

  // Renderização condicional baseada no tipo de usuário
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Mensagem para usuários sem dados (exceto demo)
  if (!isDemoUser && !hasLeagues) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-4">Nenhuma liga encontrada</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você ainda não possui ligas cadastradas. Importe uma liga do Sleeper para começar!
          </p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Importar Liga
          </button>
        </div>
      </div>
    );
  }

  if (leaguesError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar dados</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{leaguesError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Calcular estatísticas para os cards de resumo
  const totalLeagues = leagues.length;
  const totalActiveContracts = leagues.reduce((acc, league) => acc + league.totalTeams * 15, 0); // Estimativa
  const averageCapAvailable = 50000000; // $50M média (mock)
  const contractsExpiringSoon = 23; // Mock

  // Indicador visual para usuário demo
  const demoIndicator = isDemoUser ? (
    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <span className="text-yellow-600">🎭</span>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-800">
            <strong>Modo Demonstração:</strong> Você está visualizando dados fictícios para fins de
            demonstração.
          </p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar de navegação */}
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Indicador de modo demo */}
          {demoIndicator}

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Distribuição do Salary Cap por Time
                </h2>
                <SalaryCapChart leagues={leagues} />
              </div>
            </div>

            {/* Lista de ligas */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Suas Ligas</h2>
                <LeaguesList leagues={leagues} />
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
